from core.models import set_current_tenant

class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            # Assumes User model has a 'tenant' field
            set_current_tenant(request.user.tenant)
        else:
            set_current_tenant(None)
            
        response = self.get_response(request)
        
        # Clear tenant after request
        set_current_tenant(None)
        
        return response
