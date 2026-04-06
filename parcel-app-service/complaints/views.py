from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from authentication.permissions import IsAdminOrSuperAdmin
from .models import CustomerComplaint
from .serializers import CustomerComplaintSerializer


def _is_admin(user):
    return bool(getattr(user, 'is_authenticated', False) and getattr(user, 'role', None) in ['admin', 'super_admin'])

class CustomerComplaintFormViews(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        payload = dict(request.data)

        # Customers can only create complaints for their own account.
        if not _is_admin(request.user):
            payload['customer_email'] = request.user.email

        serializer = CustomerComplaintSerializer(data=payload)
        if serializer.is_valid():
            try:
                subject = CustomerComplaint.objects.get(
                    complaint_subject=payload['complaint_subject'],
                    customer_email=payload['customer_email']
                )
                if subject is not None:
                    return Response({"status": "error", "data": "Complaint already registered"})
            except CustomerComplaint.DoesNotExist:
                serializer.save()
                return Response({"status": "success", "data": "Your complaint has been registered"})
        else:
            return Response({"status": "error", "data": "Enter valid data please."})

class CustomerComplaintUpdateViews(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, complaint_id=None):
        try:
            complaint = CustomerComplaint.objects.get(id=complaint_id)

            if not _is_admin(request.user) and complaint.customer_email != request.user.email:
                return Response({"status": "error", "data": "You can only update your own complaint."},
                                status=status.HTTP_403_FORBIDDEN)

            serializer = CustomerComplaintSerializer(complaint, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"status": "success", "data": "Complaint Updated."})
            else:
                return Response({"status": "error", "data": "Enter valid data please."})
        except CustomerComplaint.DoesNotExist:
            return Response({"status": "error", "data": "Complaint was never registered."})

class GetDistinctCustomerComplaintViews(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, customer_email=None):
        if not _is_admin(request.user) and customer_email != request.user.email:
            return Response({"status": "error", "data": "You can only view your own complaints."},
                            status=status.HTTP_403_FORBIDDEN)

        dist_cus_complaint = CustomerComplaint.objects.filter(customer_email=customer_email)
        serializer = CustomerComplaintSerializer(dist_cus_complaint, many=True)
        return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)

class GetAllCustomerComplaintsViews(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def get(self, request):
        complaints = CustomerComplaint.objects.all()
        serializer = CustomerComplaintSerializer(complaints, many=True)
        return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)