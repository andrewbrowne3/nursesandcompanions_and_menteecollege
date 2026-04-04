from django.core.management.base import BaseCommand
from mentee_college_online_school.models import StudentDocument
from django.conf import settings


class Command(BaseCommand):
    help = 'Populate missing s3_url fields for documents that have s3_key'

    def handle(self, *args, **options):
        # Get the S3 bucket name from settings
        bucket_name = getattr(settings, 'AWS_STORAGE_BUCKET_NAME', 'andrewslearningimage-bucket')
        
        # Find all documents with s3_key but no s3_url
        documents = StudentDocument.objects.filter(
            s3_key__isnull=False,
            s3_key__gt='',
            s3_url__isnull=True
        ) | StudentDocument.objects.filter(
            s3_key__isnull=False,
            s3_key__gt='',
            s3_url=''
        )
        
        count = documents.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('No documents need updating. All documents have s3_url populated.'))
            
            # Show statistics
            total_docs = StudentDocument.objects.count()
            docs_with_s3_url = StudentDocument.objects.exclude(s3_url__isnull=True).exclude(s3_url='').count()
            docs_with_s3_key = StudentDocument.objects.exclude(s3_key__isnull=True).exclude(s3_key='').count()
            
            self.stdout.write(f'\nStatistics:')
            self.stdout.write(f'Total documents: {total_docs}')
            self.stdout.write(f'Documents with s3_url: {docs_with_s3_url}')
            self.stdout.write(f'Documents with s3_key: {docs_with_s3_key}')
            return
        
        self.stdout.write(f'Found {count} documents with s3_key but missing s3_url')
        
        updated = 0
        for doc in documents:
            if doc.s3_key:
                # Construct the S3 URL
                s3_url = f'https://{bucket_name}.s3.amazonaws.com/{doc.s3_key}'
                doc.s3_url = s3_url
                doc.save(update_fields=['s3_url'])
                updated += 1
                self.stdout.write(f'Updated: {doc.title} - {s3_url}')
        
        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully updated {updated} documents with S3 URLs'))
        
        # Show final statistics
        total_docs = StudentDocument.objects.count()
        docs_with_s3_url = StudentDocument.objects.exclude(s3_url__isnull=True).exclude(s3_url='').count()
        docs_with_s3_key = StudentDocument.objects.exclude(s3_key__isnull=True).exclude(s3_key='').count()
        
        self.stdout.write(f'\nFinal Statistics:')
        self.stdout.write(f'Total documents: {total_docs}')
        self.stdout.write(f'Documents with s3_url: {docs_with_s3_url}')
        self.stdout.write(f'Documents with s3_key: {docs_with_s3_key}')