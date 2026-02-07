import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IssueTokenDto } from './dto/issue-token.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { PasswordLoginDto } from './dto/password-login.dto';
import { PasswordRegisterDto } from './dto/password-register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token')
  issueToken(
    @Headers('x-internal-key') internalKey: string | undefined,
    @Body() input: IssueTokenDto,
  ) {
    const expected = process.env.AUTH_INTERNAL_KEY;
    if (!expected || internalKey !== expected) {
      throw new UnauthorizedException();
    }

    return this.authService.signToken(input);
  }

  @Post('otp/request')
  requestOtp(@Body() input: RequestOtpDto) {
    return this.authService.requestOtp(input.phone);
  }

  @Post('otp/verify')
  verifyOtp(@Body() input: VerifyOtpDto) {
    return this.authService.verifyOtp(input.phone, input.otp);
  }

  @Post('password/register')
  registerPassword(
    @Headers('x-internal-key') internalKey: string | undefined,
    @Body() input: PasswordRegisterDto,
  ) {
    const expected = process.env.AUTH_INTERNAL_KEY;
    if (!expected || internalKey !== expected) {
      throw new UnauthorizedException();
    }

    return this.authService.registerPassword(
      input.username,
      input.password,
      input.role,
      input.subjectId,
    );
  }

  @Post('password/login')
  loginPassword(@Body() input: PasswordLoginDto) {
    return this.authService.loginPassword(input.username, input.password);
  }
}
