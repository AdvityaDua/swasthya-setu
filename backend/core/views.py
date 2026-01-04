from rest_framework.views import APIView, Response, status
from core.serializers import RegisterSerializer
from core.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny


class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    'message': 'User registered successfully',
                    'name': user.full_name,
                    'role': user.role,
                    'email': user.email,
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        phone_number = request.data.get('phone')
        password = request.data.get('password')
        
        if not phone_number or not password:
            return Response({'error': 'Phone number and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(phone=phone_number)
            if user.check_password(password):
                token = RefreshToken.for_user(user)
                response = Response(
                    {
                        'message': 'Login successful',
                        'access': str(token.access_token),
                        'name': user.full_name,
                        'role': user.role,
                        'phone': user.phone,
                    },
                )
                response.set_cookie(
                    key='refresh_token',
                    value=str(token),
                    httponly=True,
                    secure=True,
                    samesite='None',
                )
                return response
            else:
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')

        if not refresh_token:
            return Response({'error': 'Refresh token not provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            new_access_token = str(token.access_token)

            return Response(
                {
                    'access': new_access_token
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response({'error': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    def post(self, request):
        response = Response(
            {'message': 'Logout successful'},
            status=status.HTTP_200_OK
        )
        response.delete_cookie('refresh_token')
        return response