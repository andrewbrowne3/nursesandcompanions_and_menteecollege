import boto3
import uuid
import os
from django.conf import settings
from botocore.exceptions import ClientError
from typing import Optional, Dict, Any
import mimetypes


class S3DocumentManager:
    """Utility class for managing document uploads to S3 with menteecollege prefix"""
    
    def __init__(self):
        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=getattr(settings, 'AWS_S3_REGION_NAME', 'us-east-1')
        )
        self.bucket_name = settings.AWS_STORAGE_BUCKET_NAME
    
    def generate_s3_key(self, cohort, filename: str, document_id: Optional[str] = None, scope: str = 'cohort') -> str:
        """
        Generate S3 key based on document scope:
        - individual/cohort: menteecollege/{year}/cohort_{number}/{program}/{scope}/{uuid}_{filename}
        - program: menteecollege/programs/{program_type}/{program_name}/{uuid}_{filename} 
        - general: menteecollege/general/{uuid}_{filename}
        """
        if not document_id:
            document_id = str(uuid.uuid4())
        
        # Clean filename
        safe_filename = filename.replace(' ', '_').replace('/', '_')
        
        if scope == 'general':
            # General documents accessible to all
            s3_key = f"menteecollege/general/{document_id}_{safe_filename}"
        elif scope == 'program':
            # Program-wide documents
            if cohort:
                program = cohort.get_program()
                program_name = program.name.replace(' ', '_').lower() if program else 'unknown'
                s3_key = f"menteecollege/programs/{cohort.program_type}/{program_name}/{document_id}_{safe_filename}"
            else:
                s3_key = f"menteecollege/programs/unknown/{document_id}_{safe_filename}"
        else:
            # Cohort or individual documents (both stored under cohort structure)
            if cohort:
                program = cohort.get_program()
                program_name = program.name.replace(' ', '_').lower() if program else 'unknown'
                s3_key = f"menteecollege/{cohort.academic_year}/cohort_{cohort.cohort_number}/{program_name}/{scope}/{document_id}_{safe_filename}"
            else:
                s3_key = f"menteecollege/uncategorized/{scope}/{document_id}_{safe_filename}"
        
        return s3_key
    
    def get_presigned_upload_url(self, s3_key: str, content_type: Optional[str] = None, 
                                expires_in: int = 3600) -> Dict[str, Any]:
        """
        Generate presigned URL for direct upload to S3
        Returns dict with upload_url and fields for form data
        """
        if not content_type:
            content_type = 'application/octet-stream'
        
        try:
            # Generate presigned POST URL
            response = self.s3_client.generate_presigned_post(
                Bucket=self.bucket_name,
                Key=s3_key,
                Fields={
                    'Content-Type': content_type,
                },
                Conditions=[
                    {'Content-Type': content_type},
                    ['content-length-range', 0, 52428800]  # Max 50MB
                ],
                ExpiresIn=expires_in
            )
            
            return {
                'upload_url': response['url'],
                'fields': response['fields'],
                's3_key': s3_key,
                's3_url': f"https://{self.bucket_name}.s3.amazonaws.com/{s3_key}"
            }
            
        except ClientError as e:
            raise Exception(f"Error generating presigned upload URL: {str(e)}")
    
    def get_presigned_download_url(self, s3_key: str, expires_in: int = 3600, 
                                  filename: Optional[str] = None) -> str:
        """
        Generate presigned URL for downloading from S3
        """
        params = {
            'Bucket': self.bucket_name,
            'Key': s3_key,
        }
        
        if filename:
            params['ResponseContentDisposition'] = f'attachment; filename="{filename}"'
        
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params=params,
                ExpiresIn=expires_in
            )
            return url
        except ClientError as e:
            raise Exception(f"Error generating presigned download URL: {str(e)}")
    
    def upload_file_to_s3(self, file_obj, s3_key: str, content_type: Optional[str] = None) -> str:
        """
        Upload file directly to S3
        Returns the S3 URL of the uploaded file
        """
        if not content_type:
            content_type = mimetypes.guess_type(s3_key)[0] or 'application/octet-stream'
        
        try:
            self.s3_client.upload_fileobj(
                file_obj,
                self.bucket_name,
                s3_key,
                ExtraArgs={
                    'ContentType': content_type,
                }
            )
            
            return f"https://{self.bucket_name}.s3.amazonaws.com/{s3_key}"
            
        except ClientError as e:
            raise Exception(f"Error uploading file to S3: {str(e)}")
    
    def delete_file_from_s3(self, s3_key: str) -> bool:
        """
        Delete file from S3
        """
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=s3_key
            )
            return True
        except ClientError as e:
            raise Exception(f"Error deleting file from S3: {str(e)}")
    
    def copy_file_in_s3(self, source_key: str, dest_key: str) -> str:
        """
        Copy file within S3 bucket
        """
        try:
            copy_source = {'Bucket': self.bucket_name, 'Key': source_key}
            self.s3_client.copy_object(
                CopySource=copy_source,
                Bucket=self.bucket_name,
                Key=dest_key
            )
            return f"https://{self.bucket_name}.s3.amazonaws.com/{dest_key}"
        except ClientError as e:
            raise Exception(f"Error copying file in S3: {str(e)}")
    
    def file_exists(self, s3_key: str) -> bool:
        """
        Check if file exists in S3
        """
        try:
            self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return False
            raise Exception(f"Error checking file existence: {str(e)}")
    
    def get_file_metadata(self, s3_key: str) -> Dict[str, Any]:
        """
        Get metadata for a file in S3
        """
        try:
            response = self.s3_client.head_object(Bucket=self.bucket_name, Key=s3_key)
            return {
                'size': response['ContentLength'],
                'content_type': response.get('ContentType', ''),
                'last_modified': response['LastModified'],
                'etag': response.get('ETag', '').strip('"'),
            }
        except ClientError as e:
            if e.response['Error']['Code'] == '404':
                return None
            raise Exception(f"Error getting file metadata: {str(e)}")
    
    def list_cohort_documents(self, cohort) -> list:
        """
        List all documents for a specific cohort
        """
        prefix = f"menteecollege/{cohort.academic_year}/cohort_{cohort.cohort_number}/"
        
        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )
            
            if 'Contents' not in response:
                return []
            
            return [obj['Key'] for obj in response['Contents']]
            
        except ClientError as e:
            raise Exception(f"Error listing cohort documents: {str(e)}")
    
    def validate_file_type(self, filename: str) -> bool:
        """
        Validate if file type is allowed
        """
        allowed_extensions = {
            '.pdf', '.docx', '.doc', '.xlsx', '.xls', 
            '.pptx', '.txt', '.jpg', '.jpeg', '.png'
        }
        file_ext = os.path.splitext(filename)[1].lower()
        return file_ext in allowed_extensions
    
    def validate_file_size(self, file_size: int, max_size_mb: int = 50) -> bool:
        """
        Validate if file size is within limits
        """
        max_size_bytes = max_size_mb * 1024 * 1024
        return file_size <= max_size_bytes