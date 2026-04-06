from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from authentication.permissions import IsVendorOrAdmin, IsCourierOrAdmin
from .models import VendorBankDetail, CourierBankDetail
from .serializers import VendorBankDetailSerializer, CourierBankDetailSerializer

class VendorBankDetailViews(APIView):
    permission_classes = [IsAuthenticated, IsVendorOrAdmin]

    @staticmethod
    def _can_access_vendor_record(request, vendor_email):
        return request.user.role in ['admin', 'super_admin'] or request.user.email == vendor_email

    def post(self, request):
        vendor_email = request.data.get('vendor_email')
        if not vendor_email:
            return Response({"status": "error", "data": "vendor_email is required."}, status=status.HTTP_400_BAD_REQUEST)

        if not self._can_access_vendor_record(request, vendor_email):
            return Response({"status": "error", "data": "You can only manage your own bank details."}, status=status.HTTP_403_FORBIDDEN)

        serializer = VendorBankDetailSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = VendorBankDetail.objects.get(vendor_email=vendor_email)
                if user is not None:
                    return Response({"status": "error", "data": "Account details already uploaded, update instead."}, status=status.HTTP_400_BAD_REQUEST)
            except VendorBankDetail.DoesNotExist:
                serializer.save()
                return Response({"status": "success", "data": "Account details saved."}, status=status.HTTP_201_CREATED)
        else:
            return Response({"status": "error", "data": "Enter valid data please.", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class GetDistinctVendorBankViews(APIView):
    permission_classes = [IsAuthenticated, IsVendorOrAdmin]

    @staticmethod
    def _can_access_vendor_record(request, vendor_email):
        return request.user.role in ['admin', 'super_admin'] or request.user.email == vendor_email

    def get(self, request, vendor_email=None):
        if not self._can_access_vendor_record(request, vendor_email):
            return Response({"status": "error", "data": "You can only view your own bank details."}, status=status.HTTP_403_FORBIDDEN)

        try:
            dist_vend_bank = VendorBankDetail.objects.get(vendor_email=vendor_email)
            serializer = VendorBankDetailSerializer(dist_vend_bank)
            return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)
        except VendorBankDetail.DoesNotExist:
            return Response({"status": "error", "data": "You have no bank details yet"},
                            status=status.HTTP_400_BAD_REQUEST)

class CourierBankDetailViews(APIView):
    permission_classes = [IsAuthenticated, IsCourierOrAdmin]

    @staticmethod
    def _can_access_courier_record(request, courier_email):
        return request.user.role in ['admin', 'super_admin'] or request.user.email == courier_email

    def post(self, request):
        courier_email = request.data.get('courier_email')
        if not courier_email:
            return Response({"status": "error", "data": "courier_email is required."}, status=status.HTTP_400_BAD_REQUEST)

        if not self._can_access_courier_record(request, courier_email):
            return Response({"status": "error", "data": "You can only manage your own bank details."}, status=status.HTTP_403_FORBIDDEN)

        serializer = CourierBankDetailSerializer(data=request.data)
        if serializer.is_valid():
            try:
                user = CourierBankDetail.objects.get(courier_email=courier_email)
                if user is not None:
                    return Response({"status": "error", "data": "Account details already uploaded, update instead."}, status=status.HTTP_400_BAD_REQUEST)
            except CourierBankDetail.DoesNotExist:
                serializer.save()
                return Response({"status": "success", "data": "Account details saved."}, status=status.HTTP_201_CREATED)
        else:
            return Response({"status": "error", "data": "Enter valid data please.", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class GetDistinctCourierBankViews(APIView):
    permission_classes = [IsAuthenticated, IsCourierOrAdmin]

    @staticmethod
    def _can_access_courier_record(request, courier_email):
        return request.user.role in ['admin', 'super_admin'] or request.user.email == courier_email

    def get(self, request, courier_email=None):
        if not self._can_access_courier_record(request, courier_email):
            return Response({"status": "error", "data": "You can only view your own bank details."}, status=status.HTTP_403_FORBIDDEN)

        try:
            dist_courier_bank = CourierBankDetail.objects.get(courier_email=courier_email)
            serializer = CourierBankDetailSerializer(dist_courier_bank)
            return Response({"status": "success", "data": serializer.data}, status=status.HTTP_200_OK)
        except CourierBankDetail.DoesNotExist:
            return Response({"status": "error", "data": "You have no bank details yet"},
                            status=status.HTTP_400_BAD_REQUEST)

class VendorBankUpdateViews(APIView):
    permission_classes = [IsAuthenticated, IsVendorOrAdmin]

    @staticmethod
    def _can_access_vendor_record(request, vendor_email):
        return request.user.role in ['admin', 'super_admin'] or request.user.email == vendor_email

    def patch(self, request, vendor_email=None):
        if not self._can_access_vendor_record(request, vendor_email):
            return Response({"status": "error", "data": "You can only update your own bank details."}, status=status.HTTP_403_FORBIDDEN)

        try:
            item = VendorBankDetail.objects.get(vendor_email=vendor_email)
            serializer = VendorBankDetailSerializer(item, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"status": "success", "data": "Account details updated."})
            else:
                return Response({"status": "error", "data": "Enter valid data please.", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        except VendorBankDetail.DoesNotExist:
            return Response({"status": "error", "data": "Account not found, save one."}, status=status.HTTP_404_NOT_FOUND)

class CourierBankUpdateViews(APIView):
    permission_classes = [IsAuthenticated, IsCourierOrAdmin]

    @staticmethod
    def _can_access_courier_record(request, courier_email):
        return request.user.role in ['admin', 'super_admin'] or request.user.email == courier_email

    def patch(self, request, courier_email=None):
        if not self._can_access_courier_record(request, courier_email):
            return Response({"status": "error", "data": "You can only update your own bank details."}, status=status.HTTP_403_FORBIDDEN)

        try:
            item = CourierBankDetail.objects.get(courier_email=courier_email)
            serializer = CourierBankDetailSerializer(item, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({"status": "success", "data": "Account details updated."})
            else:
                return Response({"status": "error", "data": "Enter valid data please.", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        except CourierBankDetail.DoesNotExist:
            return Response({"status": "error", "data": "Account not found, save one."}, status=status.HTTP_404_NOT_FOUND)