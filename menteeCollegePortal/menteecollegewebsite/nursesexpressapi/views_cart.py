from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from mentee_college_online_school import models
import json
import uuid
from datetime import datetime


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def cart_operations(request):
    """
    Handle cart operations for the authenticated user
    GET: Retrieve cart contents
    POST: Add item to cart
    """
    user = request.user
    
    try:
        student = get_object_or_404(models.Student, user=user)
    except:
        student = get_object_or_404(models.Student, username=user.username)
    
    if request.method == 'GET':
        # Return cart contents from session or database
        cart_items = request.session.get(f'cart_{student.id}', [])
        total = sum(item.get('amount', 0) * item.get('quantity', 1) for item in cart_items)
        
        return Response({
            'items': cart_items,
            'total': total,
            'item_count': len(cart_items)
        })
    
    elif request.method == 'POST':
        # Add item to cart
        data = request.data
        
        required_fields = ['program_id', 'program_type', 'program_name', 'amount']
        for field in required_fields:
            if field not in data:
                return Response(
                    {'error': f'Missing required field: {field}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Get or create cart in session
        cart_key = f'cart_{student.id}'
        cart_items = request.session.get(cart_key, [])
        
        # Create new cart item
        cart_item = {
            'id': str(uuid.uuid4()),
            'program_id': data['program_id'],
            'program_type': data['program_type'],
            'program_name': data['program_name'],
            'amount': float(data['amount']),
            'payment_type': data.get('payment_type', 'installment'),
            'due_date': data.get('due_date'),
            'quantity': int(data.get('quantity', 1)),
            'added_at': datetime.now().isoformat()
        }
        
        # Check if item already exists
        existing_item = None
        for i, item in enumerate(cart_items):
            if (item['program_id'] == cart_item['program_id'] and 
                item['program_type'] == cart_item['program_type']):
                existing_item = i
                break
        
        if existing_item is not None:
            # Update quantity
            cart_items[existing_item]['quantity'] += cart_item['quantity']
        else:
            # Add new item
            cart_items.append(cart_item)
        
        # Save to session
        request.session[cart_key] = cart_items
        request.session.modified = True
        
        total = sum(item['amount'] * item['quantity'] for item in cart_items)
        
        return Response({
            'success': True,
            'item': cart_item,
            'cart_total': total,
            'item_count': len(cart_items)
        }, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def cart_item_operations(request, item_id):
    """
    Handle individual cart item operations
    PUT: Update item quantity
    DELETE: Remove item from cart
    """
    user = request.user
    
    try:
        student = get_object_or_404(models.Student, user=user)
    except:
        student = get_object_or_404(models.Student, username=user.username)
    
    cart_key = f'cart_{student.id}'
    cart_items = request.session.get(cart_key, [])
    
    # Find item by ID
    item_index = None
    for i, item in enumerate(cart_items):
        if item['id'] == item_id:
            item_index = i
            break
    
    if item_index is None:
        return Response(
            {'error': 'Item not found in cart'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'PUT':
        # Update item quantity
        data = request.data
        new_quantity = int(data.get('quantity', 1))
        
        if new_quantity <= 0:
            # Remove item if quantity is 0 or negative
            cart_items.pop(item_index)
        else:
            cart_items[item_index]['quantity'] = new_quantity
        
        request.session[cart_key] = cart_items
        request.session.modified = True
        
        total = sum(item['amount'] * item['quantity'] for item in cart_items)
        
        return Response({
            'success': True,
            'cart_total': total,
            'item_count': len(cart_items)
        })
    
    elif request.method == 'DELETE':
        # Remove item from cart
        removed_item = cart_items.pop(item_index)
        request.session[cart_key] = cart_items
        request.session.modified = True
        
        total = sum(item['amount'] * item['quantity'] for item in cart_items)
        
        return Response({
            'success': True,
            'removed_item': removed_item,
            'cart_total': total,
            'item_count': len(cart_items)
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_cart(request):
    """
    Clear all items from the cart
    """
    user = request.user
    
    try:
        student = get_object_or_404(models.Student, user=user)
    except:
        student = get_object_or_404(models.Student, username=user.username)
    
    cart_key = f'cart_{student.id}'
    request.session[cart_key] = []
    request.session.modified = True
    
    return Response({
        'success': True,
        'message': 'Cart cleared successfully'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_bill_to_cart(request):
    """
    Add current student bill amounts to cart
    """
    user = request.user

    try:
        student = get_object_or_404(models.Student, user=user)
    except:
        student = get_object_or_404(models.Student, username=user.username)

    # Check if student has any enrolled programs
    has_enrollments = (
        student.enrolled_certificate_programs.exists() or
        student.enrolled_diploma_programs.exists() or
        student.enrolled_associates_programs.exists()
    )

    if not has_enrollments:
        # Check if student has applications
        has_applications = (
            student.diploma_applications.exists() or
            student.certificate_applications.exists() or
            student.associates_applications.exists()
        )

        if has_applications:
            return Response({
                'success': False,
                'error': 'application_pending',
                'message': 'Your application is being processed. You will be able to make payments once your enrollment is confirmed by our admissions team.'
            }, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({
                'success': False,
                'error': 'no_enrollment',
                'message': 'You are not currently enrolled in any programs. Please submit an application or contact admissions.'
            }, status=status.HTTP_400_BAD_REQUEST)

    # Get payment details
    payment_details = student.get_payment_details()
    cart_key = f'cart_{student.id}'
    cart_items = request.session.get(cart_key, [])

    items_added = 0
    
    # Add certificate courses
    for course in payment_details.get('certificate_courses', []):
        balance = (course.get('total_due', 0) - course.get('total_paid', 0))
        if balance > 0:
            cart_item = {
                'id': str(uuid.uuid4()),
                'program_id': course.get('program_name', 'unknown'),
                'program_type': 'certificate',
                'program_name': course.get('program_name', 'Certificate Program'),
                'amount': float(balance),
                'payment_type': 'installment',
                'due_date': payment_details.get('next_due_date'),
                'quantity': 1,
                'added_at': datetime.now().isoformat()
            }
            cart_items.append(cart_item)
            items_added += 1
    
    # Add diploma programs
    for program in payment_details.get('diploma_programs', []):
        balance = (program.get('total_due', 0) - program.get('total_paid', 0))
        if balance > 0:
            cart_item = {
                'id': str(uuid.uuid4()),
                'program_id': program.get('program_name', 'unknown'),
                'program_type': 'diploma',
                'program_name': program.get('program_name', 'Diploma Program'),
                'amount': float(balance),
                'payment_type': 'installment',
                'due_date': payment_details.get('next_due_date'),
                'quantity': 1,
                'added_at': datetime.now().isoformat()
            }
            cart_items.append(cart_item)
            items_added += 1
    
    # Add associate programs
    for program in payment_details.get('associate_programs', []):
        balance = (program.get('total_due', 0) - program.get('total_paid', 0))
        if balance > 0:
            cart_item = {
                'id': str(uuid.uuid4()),
                'program_id': program.get('program_name', 'unknown'),
                'program_type': 'associates',
                'program_name': program.get('program_name', 'Associates Program'),
                'amount': float(balance),
                'payment_type': 'installment',
                'due_date': payment_details.get('next_due_date'),
                'quantity': 1,
                'added_at': datetime.now().isoformat()
            }
            cart_items.append(cart_item)
            items_added += 1
    
    # Save to session
    request.session[cart_key] = cart_items
    request.session.modified = True

    total = sum(item['amount'] * item['quantity'] for item in cart_items)

    # If no items were added, return helpful message
    if items_added == 0:
        return Response({
            'success': False,
            'error': 'no_balance_due',
            'message': 'You have no outstanding balance to pay at this time. All your payments are up to date!',
            'items_added': 0,
            'cart_total': total,
            'item_count': len(cart_items)
        }, status=status.HTTP_200_OK)

    return Response({
        'success': True,
        'items_added': items_added,
        'cart_total': total,
        'item_count': len(cart_items)
    })