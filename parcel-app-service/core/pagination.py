from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    """Page-number pagination returning the API's standard success envelope.

    Shape: {"status": "success", "data": [...], "pagination": {...}}
    Clients pass ?page=N and optionally ?page_size=N (capped at max_page_size).
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_pagination_meta(self):
        return {
            "page": self.page.number,
            "page_size": self.page.paginator.per_page,
            "total_count": self.page.paginator.count,
            "total_pages": self.page.paginator.num_pages,
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
        }

    def get_paginated_response(self, data):
        return Response({
            "status": "success",
            "data": data,
            "pagination": self.get_pagination_meta(),
        })


def paginated_response(request, queryset, serialize):
    """Paginate a queryset in an APIView; serialize maps the page's items to response data."""
    paginator = StandardPagination()
    page = paginator.paginate_queryset(queryset, request)
    return paginator.get_paginated_response(serialize(page))


def paginate_group(request, queryset, serialize):
    """Paginate one group of a grouped listing; returns (data, pagination_meta)."""
    paginator = StandardPagination()
    page = paginator.paginate_queryset(queryset, request)
    return serialize(page), paginator.get_pagination_meta()
