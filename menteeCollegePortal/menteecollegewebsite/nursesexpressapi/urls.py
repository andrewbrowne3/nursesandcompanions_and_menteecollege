from django.urls import path
from mentee_college_online_school import views_analytics

from . import (
    views,
    views_documents_fbv,  # Import function-based views
    views_cart,  # Import cart views
    views_cohort_management,  # Import cohort management views
    views_student_portal,  # Import student portal views
    views_admin_management,  # Import admin management views
    viewscookies,
)

urlpatterns = [
    path("api/", views.Test),
    path("cohorts-list/", views.getCohorts, name="cohorts-list"),
    path("courses", views.getCourses),
    path("api/user-profile", views.getUserProfile),
    path("course/<str:pk>", views.getCourse),
    path(
        "api/users/login/",
        views.MyTokenObtainPairView.as_view(),
        name="token_obtain_pair",
    ),
    path("api/application/post", views.application_view, name="appilication post"),
    path(
        "api/create-payment-intent", views.create_payment, name="create-payment-intent"
    ),
    path("api/students/<str:username>/", views.student_detail, name="student-detail"),
    path("api/record-payment", views.recordpayment, name="recordpayment"),
    path("send-test-email/", views.send_test_email, name="send-test-email"),
    path(
        "validate_discount_code/", views.validate_discount_code, name="validatediscount"
    ),
    path("api/track-page/", viewscookies.track_page_view, name="trackpage"),
    # Course CRUD API endpoints
    path("api/courses/", views.course_list, name="course-list"),
    path("api/courses/create/", views.course_create, name="course-create"),
    path("api/courses/<str:pk>/", views.course_detail, name="course-detail"),
    path("api/courses/<str:pk>/update/", views.course_update, name="course-update"),
    path("api/courses/<str:pk>/delete/", views.course_delete, name="course-delete"),
    # New formatted course list and stats endpoints
    path(
        "api/courses/categories/",
        views.course_list_by_category,
        name="course-list-by-category",
    ),
    path("api/courses/stats/", views.course_stats, name="course-stats"),
    # Analytics endpoints
    path(
        "api/analytics/applications/",
        views_analytics.get_application_stats,
        name="application-stats",
    ),
    path(
        "api/analytics/revenue/",
        views_analytics.get_revenue_stats,
        name="revenue-stats",
    ),
    path(
        "api/analytics/conversions/",
        views_analytics.get_conversion_stats,
        name="conversion-stats",
    ),
    path(
        "api/analytics/program-popularity/",
        views_analytics.get_program_popularity,
        name="program-popularity",
    ),
    # Document Management API endpoints (Function-based views)
    path(
        "api/cohorts/",
        views_documents_fbv.cohorts_list_create,
        name="cohorts-list-create",
    ),
    path(
        "api/cohorts/<str:pk>/", views_documents_fbv.cohort_detail, name="cohort-detail"
    ),
    path(
        "api/document-categories/",
        views_documents_fbv.document_categories_list_create,
        name="document-categories-list-create",
    ),
    path(
        "api/document-categories/<str:pk>/",
        views_documents_fbv.document_category_detail,
        name="document-category-detail",
    ),
    path(
        "api/documents/",
        views_documents_fbv.documents_list_create,
        name="documents-list-create",
    ),
    path(
        "api/documents/<str:pk>/",
        views_documents_fbv.document_detail,
        name="document-detail",
    ),
    path(
        "api/documents/<str:pk>/download/",
        views_documents_fbv.document_download,
        name="document-download",
    ),
    path(
        "api/document-acknowledgments/",
        views_documents_fbv.document_acknowledgments_list_create,
        name="document-acknowledgments-list-create",
    ),
    path(
        "api/document-acknowledgments/<str:pk>/",
        views_documents_fbv.document_acknowledgment_detail,
        name="document-acknowledgment-detail",
    ),
    # Cart API endpoints
    path("api/cart/", views_cart.cart_operations, name="cart-operations"),
    path("api/cart/item/<str:item_id>/", views_cart.cart_item_operations, name="cart-item-operations"),
    path("api/cart/clear/", views_cart.clear_cart, name="clear-cart"),
    path("api/cart/add-bill/", views_cart.add_bill_to_cart, name="add-bill-to-cart"),
    # Cohort Management API endpoints
    path("api/cohorts/<uuid:cohort_id>/students/", views_cohort_management.cohort_students, name="cohort-students"),
    path("api/cohorts/<uuid:cohort_id>/analytics/", views_cohort_management.cohort_analytics, name="cohort-analytics"),
    path("api/cohorts/<uuid:cohort_id>/bulk-email/", views_cohort_management.cohort_bulk_email, name="cohort-bulk-email"),
    path("api/cohorts/dashboard-stats/", views_cohort_management.cohorts_dashboard_stats, name="cohorts-dashboard-stats"),
    path("api/students/<uuid:student_id>/cohort-details/", views_cohort_management.student_cohort_details, name="student-cohort-details"),
    # Student Portal API endpoints
    path("api/student/dashboard/", views_student_portal.student_dashboard_data, name="student-dashboard"),
    path("api/student/academic-summary/", views_student_portal.student_academic_summary, name="student-academic-summary"),
    path("api/student/submit-course-survey/", views_student_portal.submit_course_survey, name="submit-course-survey"),
    # Admin Management API endpoints (Admin only)
    path("api/admin/students/<str:username>/assign-courses/", views_admin_management.assign_courses_to_student, name="admin-assign-courses"),
    path("api/admin/students/<str:username>/update-cohort/", views_admin_management.update_student_cohort, name="admin-update-cohort"),
    path("api/admin/students/<str:username>/manage-programs/", views_admin_management.manage_student_programs, name="admin-manage-programs"),
    path("api/admin/students/<str:username>/grades/", views_admin_management.get_student_grades, name="admin-get-grades"),
    path("api/admin/students/<str:username>/update-grade/", views_admin_management.update_student_grade, name="admin-update-grade"),
    path("api/admin/students/<str:username>/record-payment/", views_admin_management.record_payment, name="admin-record-payment"),
    path("api/admin/students/<str:username>/update-contact/", views_admin_management.update_student_contact, name="admin-update-contact"),
    path("api/admin/students/<str:username>/create-payment-schedule/", views_admin_management.create_payment_schedule, name="admin-create-payment-schedule"),
    path("api/admin/students/<str:username>/payment-schedules/", views_admin_management.list_payment_schedules, name="admin-list-payment-schedules"),
    path("api/admin/students/<str:username>/payment-schedules/<str:schedule_id>/", views_admin_management.delete_payment_schedule, name="admin-delete-payment-schedule"),
    path("api/admin/students/create/", views_admin_management.create_student, name="admin-create-student"),
    path("api/admin/resources/", views_admin_management.get_admin_resources, name="admin-resources"),
]
