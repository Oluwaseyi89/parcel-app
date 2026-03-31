from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import VendorBankDetail, CourierBankDetail
from .serializers import VendorBankDetailSerializer, CourierBankDetailSerializer

class VendorBankDetailViews(APIView):
    def post(self, request):
        serializer = VendorBankDetailSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = VendorBankDetail.objects.get(vendor_email=request.data['vendor_email'])
                if user is not None:
                    return Response({"status": "error", "data": "Account details already uploaded, update instead."})
            except VendorBankDetail.DoesNotExist:
                serializer.save()
                return Response({"status": "success", "data": "Account details saved."})
        else:
            return Response({"status": "error", "data": "Enter valid data please."})

class GetDistinctVendorBankViews(APIView):
    def get(self, request, vendor_email=None):
        try:
            dist_vend_bank = VendorBankDetail.objects.get(vendor_email=vendor_email)
            serializer = VendorBankDetailSerializer(dist_vend_bank)
            return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)
        except VendorBankDetail.DoesNotExist:
            return Response({"status": "error", "data": "You have no bank details yet"},
                            status=status.HTTP_400_BAD_REQUEST)

class CourierBankDetailViews(APIView):
    def post(self, request):
        serializer = CourierBankDetailSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = CourierBankDetail.objects.get(courier_email=request.data['courier_email'])
                if user is not None:
                    return Response({"status": "error", "data": "Account details already uploaded, update instead."})
            except CourierBankDetail.DoesNotExist:
                serializer.save()
                return Response({"status": "success", "data": "Account details saved."})
        else:
            return Response({"status": "error", "data": "Enter valid data please."})

class VendorBankUpdateViews(APIView):
    def patch(self, request, vendor_email=None):
        try:
            item = VendorBankDetail.objects.get(vendor_email=vendor_email)
            serializer = VendorBankDetailSerializer(item, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"status": "success", "data": "Account details updated."})
            else:
                return Response({"status": "error", "data": "Enter valid data please."})
        except VendorBankDetail.DoesNotExist:
            return Response({"status": "error", "data": "Account not found, save one."})

class CourierBankUpdateViews(APIView):
    def patch(self, request, courier_email=None):
        try:
            item = CourierBankDetail.objects.get(courier_email=courier_email)
            serializer = VendorBankDetailSerializer(item, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"status": "success", "data": "Account details updated."})
            else:
                return Response({"status": "error", "data": "Enter valid data please."})
        except CourierBankDetail.DoesNotExist:
            return Response({"status": "error", "data": "Account not found, save one."})