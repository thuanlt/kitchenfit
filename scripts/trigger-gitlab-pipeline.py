#!/usr/bin/env python3
"""
GitLab Pipeline Trigger Script

Usage:
  python scripts/trigger-gitlab-pipeline.py
  python scripts/trigger-gitlab-pipeline.py --env prod
  python scripts/trigger-gitlab-pipeline.py --branch develop --suite api
"""

import os
import sys
import argparse
import time
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
GITLAB_URL = os.getenv('GITLAB_URL', 'https://gitlab.com')
PROJECT_ID = os.getenv('GITLAB_PROJECT_ID')
PRIVATE_TOKEN = os.getenv('GITLAB_PRIVATE_TOKEN')
TRIGGER_TOKEN = os.getenv('GITLAB_TRIGGER_TOKEN')

# Default values
DEFAULT_REF = 'master'
DEFAULT_ENV = 'stg'


def print_help():
    """Print help message"""
    print("""
GitLab Pipeline Trigger Script

Usage:
  python scripts/trigger-gitlab-pipeline.py [options]

Options:
  --ref, --branch <branch>    Branch to run pipeline on (default: master)
  --env <environment>          Environment: stg, prod, jp (default: stg)
  --suite <suite>             Test suite: smoke, regression, api
  --var <key=value>           Custom variable
  --trigger-token             Use trigger token instead of private token
  --wait                      Wait for pipeline to complete
  --dry-run                   Show what would be triggered without actually triggering
  --help, -h                  Show this help message

Examples:
  # Trigger regression tests on staging
  python scripts/trigger-gitlab-pipeline.py --env stg --suite regression

  # Trigger API tests on production
  python scripts/trigger-gitlab-pipeline.py --env prod --suite api --branch master

  # Trigger with custom variables
  python scripts/trigger-gitlab-pipeline.py --var BASE_URL=https://custom.url

  # Wait for pipeline to complete
  python scripts/trigger-gitlab-pipeline.py --env prod --wait

  # Dry run to see what would be triggered
  python scripts/trigger-gitlab-pipeline.py --env prod --dry-run

Environment Variables:
  GITLAB_URL              GitLab instance URL (default: https://gitlab.com)
  GITLAB_PROJECT_ID       Project ID or path (e.g., namespace/project)
  GITLAB_PRIVATE_TOKEN    Personal access token (api scope)
  GITLAB_TRIGGER_TOKEN    Pipeline trigger token
""")


def validate_config(options):
    """Validate configuration"""
    errors = []

    if not PROJECT_ID:
        errors.append('GITLAB_PROJECT_ID is required')

    if options['use_trigger_token']:
        if not TRIGGER_TOKEN:
            errors.append('GITLAB_TRIGGER_TOKEN is required when using --trigger-token')
    else:
        if not PRIVATE_TOKEN:
            errors.append('GITLAB_PRIVATE_TOKEN is required')

    if errors:
        print('Configuration errors:')
        for error in errors:
            print(f'  - {error}')
        print('\nPlease set the required environment variables in .env file')
        sys.exit(1)


def trigger_with_private_token(options):
    """Trigger pipeline using private token"""
    url = f"{GITLAB_URL}/api/v4/projects/{requests.utils.quote(PROJECT_ID, safe='')}/pipeline"
    
    data = {
        'ref': options['ref'],
        'variables': {
            'APP_ENV': options['env'],
            **options['variables']
        }
    }

    if options['suite']:
        data['variables']['TEST_SUITE'] = options['suite']

    headers = {
        'PRIVATE-TOKEN': PRIVATE_TOKEN,
        'Content-Type': 'application/json'
    }

    print('\n=== Pipeline Trigger Info ===')
    print(f'URL: {url}')
    print(f'Branch: {options["ref"]}')
    print(f'Environment: {options["env"]}')
    if options['suite']:
        print(f'Suite: {options["suite"]}')
    print(f'Variables: {data["variables"]}')

    if options['dry_run']:
        print('\n[DRY RUN] Pipeline would be triggered with the above configuration.')
        return None

    try:
        print('\nTriggering pipeline...')
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()
        
        result = response.json()
        print('\n✅ Pipeline triggered successfully!')
        print(f'Pipeline ID: {result["id"]}')
        print(f'Web URL: {result["web_url"]}')
        print(f'Status: {result["status"]}')
        print(f'Created at: {result["created_at"]}')
        
        return result
    except requests.exceptions.RequestException as e:
        print('\n❌ Failed to trigger pipeline:')
        if hasattr(e, 'response') and e.response is not None:
            print(f'Status: {e.response.status_code}')
            try:
                print(f'Message: {e.response.json().get("message", str(e.response.json()))}')
            except:
                print(f'Message: {e.response.text}')
        else:
            print(str(e))
        raise


def trigger_with_trigger_token(options):
    """Trigger pipeline using trigger token"""
    url = f"{GITLAB_URL}/api/v4/projects/{requests.utils.quote(PROJECT_ID, safe='')}/trigger/pipeline"
    
    data = {
        'token': TRIGGER_TOKEN,
        'ref': options['ref']
    }
    
    # Add variables
    variables = {
        'APP_ENV': options['env'],
        **options['variables']
    }
    
    if options['suite']:
        variables['TEST_SUITE'] = options['suite']
    
    for key, value in variables.items():
        data[f'variables[{key}]'] = value

    print('\n=== Pipeline Trigger Info ===')
    print(f'URL: {url}')
    print(f'Branch: {options["ref"]}')
    print(f'Environment: {options["env"]}')
    if options['suite']:
        print(f'Suite: {options["suite"]}')
    print(f'Variables: {variables}')

    if options['dry_run']:
        print('\n[DRY RUN] Pipeline would be triggered with the above configuration.')
        return None

    try:
        print('\nTriggering pipeline...')
        response = requests.post(url, data=data)
        response.raise_for_status()
        
        result = response.json()
        print('\n✅ Pipeline triggered successfully!')
        print(f'Pipeline ID: {result["id"]}')
        print(f'Web URL: {result["web_url"]}')
        print(f'Status: {result["status"]}')
        print(f'Created at: {result["created_at"]}')
        
        return result
    except requests.exceptions.RequestException as e:
        print('\n❌ Failed to trigger pipeline:')
        if hasattr(e, 'response') and e.response is not None:
            print(f'Status: {e.response.status_code}')
            try:
                print(f'Message: {e.response.json().get("message", str(e.response.json()))}')
            except:
                print(f'Message: {e.response.text}')
        else:
            print(str(e))
        raise


def wait_for_pipeline(pipeline_id):
    """Wait for pipeline to complete"""
    url = f"{GITLAB_URL}/api/v4/projects/{requests.utils.quote(PROJECT_ID, safe='')}/pipelines/{pipeline_id}"
    headers = {'PRIVATE-TOKEN': PRIVATE_TOKEN}

    print(f'\nWaiting for pipeline {pipeline_id} to complete...')
    print('Press Ctrl+C to stop waiting (pipeline will continue running)')

    poll_interval = 10  # seconds
    status = 'pending'

    while status in ['pending', 'running']:
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            result = response.json()
            status = result['status']
            
            timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
            print(f'[{timestamp}] Status: {status}')
            
            if status == 'success':
                print('\n✅ Pipeline completed successfully!')
                return result
            elif status in ['failed', 'canceled', 'skipped']:
                print(f'\n❌ Pipeline {status}!')
                print(f'View details: {result["web_url"]}')
                return result
            
            time.sleep(poll_interval)
        except requests.exceptions.RequestException as e:
            print(f'Error polling pipeline status: {str(e)}')
            time.sleep(poll_interval)


def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description='GitLab Pipeline Trigger Script',
        add_help=False
    )
    
    parser.add_argument('--ref', '--branch', default=DEFAULT_REF,
                        help='Branch to run pipeline on (default: master)')
    parser.add_argument('--env', default=DEFAULT_ENV,
                        choices=['stg', 'prod', 'jp'],
                        help='Environment: stg, prod, jp (default: stg)')
    parser.add_argument('--suite', choices=['smoke', 'regression', 'api'],
                        help='Test suite: smoke, regression, api')
    parser.add_argument('--var', action='append', dest='variables',
                        help='Custom variable in format key=value')
    parser.add_argument('--trigger-token', action='store_true',
                        help='Use trigger token instead of private token')
    parser.add_argument('--wait', action='store_true',
                        help='Wait for pipeline to complete')
    parser.add_argument('--dry-run', action='store_true',
                        help='Show what would be triggered without actually triggering')
    parser.add_argument('--help', '-h', action='store_true',
                        help='Show this help message')
    
    args = parser.parse_args()
    
    if args.help:
        print_help()
        sys.exit(0)
    
    # Parse custom variables
    variables = {}
    if args.variables:
        for var in args.variables:
            if '=' in var:
                key, value = var.split('=', 1)
                variables[key] = value
            else:
                print(f'Warning: Invalid variable format: {var}')
    
    options = {
        'ref': args.ref,
        'env': args.env,
        'suite': args.suite,
        'variables': variables,
        'use_trigger_token': args.trigger_token,
        'dry_run': args.dry_run
    }
    
    try:
        print('=' * 40)
        print('  GitLab Pipeline Trigger')
        print('=' * 40)
        
        validate_config(options)
        
        if options['use_trigger_token']:
            result = trigger_with_trigger_token(options)
        else:
            result = trigger_with_private_token(options)
        
        if result and not options['dry_run']:
            if args.wait:
                wait_for_pipeline(result['id'])
            
            print('\n' + '=' * 40)
            print('Pipeline triggered successfully!')
            print('=' * 40)
    
    except Exception as e:
        print(f'\nFatal error: {str(e)}')
        sys.exit(1)


if __name__ == '__main__':
    main()
