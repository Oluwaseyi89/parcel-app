from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from authentication.permissions import IsAdminOrSuperAdmin
from core.pagination import paginated_response
from .models import CustomerComplaint
from .serializers import CustomerComplaintSerializer


def _is_admin(user):
    return bool(getattr(user, 'is_authenticated', False) and getattr(user, 'role', None) in ['admin', 'super_admin'])

class CustomerComplaintFormViews(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # copy() keeps QueryDict semantics for form posts; dict() would turn each value into a list.
        payload = request.data.copy()

        # Customers can only create complaints for their own account.
        if not _is_admin(request.user):
            payload['customer_email'] = request.user.email

        serializer = CustomerComplaintSerializer(data=payload)
        serializer.is_valid(raise_exception=True)

        if CustomerComplaint.objects.filter(
            complaint_subject=serializer.validated_data['complaint_subject'],
            customer_email=serializer.validated_data['customer_email'],
        ).exists():
            return Response({"status": "error", "message": "Complaint already registered"},
                            status=status.HTTP_409_CONFLICT)

        serializer.save()
        return Response({"status": "success", "data": "Your complaint has been registered"},
                        status=status.HTTP_201_CREATED)

class CustomerComplaintUpdateViews(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, complaint_id=None):
        try:
            complaint = CustomerComplaint.objects.get(id=complaint_id)
        except CustomerComplaint.DoesNotExist:
            return Response({"status": "error", "message": "Complaint was never registered."},
                            status=status.HTTP_404_NOT_FOUND)

        payload = request.data.copy()
        if not _is_admin(request.user):
            if complaint.customer_email != request.user.email:
                return Response({"status": "error", "message": "You can only update your own complaint."},
                                status=status.HTTP_403_FORBIDDEN)
            # Customers cannot move a complaint onto another account.
            payload['customer_email'] = complaint.customer_email

        serializer = CustomerComplaintSerializer(complaint, data=payload, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"status": "success", "data": "Complaint Updated."})

class GetDistinctCustomerComplaintViews(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, customer_email=None):
        if not _is_admin(request.user) and customer_email != request.user.email:
            return Response({"status": "error", "message": "You can only view your own complaints."},
                            status=status.HTTP_403_FORBIDDEN)

        dist_cus_complaint = CustomerComplaint.objects.filter(customer_email=customer_email)
        serializer = CustomerComplaintSerializer(dist_cus_complaint, many=True)
        return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)

class GetAllCustomerComplaintsViews(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def get(self, request):
        complaints = CustomerComplaint.objects.all().order_by('-id')
        return paginated_response(request, complaints, lambda page: CustomerComplaintSerializer(page, many=True).data)