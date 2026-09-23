from django.urls import path
from .views import (
    MaterialListCreateView, 
    MaterialDetailView, 
    TagListCreateView, 
    TagDetailView,
    MaterialTagView,
    ReadingProgressView,
    MaterialSearchView
)

urlpatterns = [
    path('materials/',                              MaterialListCreateView.as_view(), name='material-list'),
    path('materials/search/',                       MaterialSearchView.as_view(), name='material-search'),
    path('materials/<uuid:pk>/',                    MaterialDetailView.as_view(),   name='material-detail'),
    path('tags/',                                   TagListCreateView.as_view(), name='tag-list'),
    path('tags/<uuid:pk>/',                         TagDetailView.as_view(), name='tag-detail'),
    path('materials/<uuid:pk>/tags/',               MaterialTagView.as_view(), name='material-tags'),
    path('materials/<uuid:pk>/tags/<uuid:tag_id>/', MaterialTagView.as_view(), name='material-tag-detail'),
    path('materials/<uuid:pk>/progress/',           ReadingProgressView.as_view(), name='material-progress'),
]
