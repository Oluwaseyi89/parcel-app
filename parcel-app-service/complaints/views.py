from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import CustomerComplaint
from .serializers import CustomerComplaintSerializer

class CustomerComplaintFormViews(APIView):
    def post(self, request):
        serializer = CustomerComplaintSerializer(data=request.data)
        if serializer.is_valid():
            try:
                subject = CustomerComplaint.objects.get(complaint_subject=request.data['complaint_subject'],
                                                        customer_email=request.data['customer_email'])
                if subject is not None:
                    return Response({"status": "error", "data": "Complaint already registered"})
            except CustomerComplaint.DoesNotExist:
                serializer.save()
                return Response({"status": "success", "data": "Your complaint has been registered"})
        else:
            print(serializer.errors)
            return Response({"status": "error", "data": "Enter valid data please."})

class CustomerComplaintUpdateViews(APIView):
    def patch(self, request, complaint_id=None):
        try:
            complaint = CustomerComplaint.objects.get(id=complaint_id)
            serializer = CustomerComplaintSerializer(complaint, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"status": "success", "data": "Complaint Updated."})
            else:
                return Response({"status": "error", "data": "Enter valid data please."})
        except CustomerComplaint.DoesNotExist:
            return Response({"status": "error", "data": "Complaint was never registered."})

class GetDistinctCustomerComplaintViews(APIView):
    def get(self, request, customer_email=None):
        try:
            dist_cus_complaint = CustomerComplaint.objects.filter(customer_email=customer_email)
            serializer = CustomerComplaintSerializer(dist_cus_complaint, many=True)
            return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)
        except CustomerComplaint.DoesNotExist:
            return Response({"status": "error", "data": "You are yet to upload any product"},
                            status=status.HTTP_400_BAD_REQUEST)

class GetAllCustomerComplaintsViews(APIView):
    def get(self, request):
        complaints = CustomerComplaint.objects.all()
        serializer = CustomerComplaintSerializer(complaints, many=True)
        return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)