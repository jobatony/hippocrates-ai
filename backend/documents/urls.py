from django.urls import path
from .views import MaterialListCreateView, MaterialDetailView

urlpatterns = [
    path('materials/',          MaterialListCreateView.as_view(), name='material-list'),
    path('materials/<uuid:pk>/', MaterialDetailView.as_view(),   name='material-detail'),
]
