import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { RequestVendorOtpDto } from './dto/request-vendor-otp.dto';
import { VendorDocumentDto } from './dto/vendor-document.dto';
import { VendorEmailLoginDto } from './dto/vendor-email-login.dto';
import { VendorEmailRegisterDto } from './dto/vendor-email-register.dto';
import { VendorEmailResetConfirmDto } from './dto/vendor-email-reset-confirm.dto';
import { VendorEmailResetRequestDto } from './dto/vendor-email-reset-request.dto';
import { VendorOauthExchangeDto } from './dto/vendor-oauth-exchange.dto';
import { VendorProfileDto } from './dto/vendor-profile.dto';
import { VendorRefreshDto } from './dto/vendor-refresh.dto';
import { VerifyVendorOtpDto } from './dto/verify-vendor-otp.dto';
import { VendorsService } from './vendors.service';

@ApiTags('Vendors (Onboarding)')
@Controller('vendors/onboarding')
export class VendorsOnboardingController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post('otp/request')
  requestOtp(@Body() input: RequestVendorOtpDto) {
    return this.vendorsService.requestVendorOtp(input.phone);
  }

  @Post('otp/verify')
  verifyOtp(@Body() input: VerifyVendorOtpDto) {
    return this.vendorsService.verifyVendorOtp(input.phone, input.otp);
  }

  @Post('email/register')
  registerEmail(@Body() input: VendorEmailRegisterDto) {
    return this.vendorsService.registerVendorEmail(input.email, input.password, input.phone);
  }

  @Post('email/login')
  loginEmail(@Body() input: VendorEmailLoginDto) {
    return this.vendorsService.loginVendorEmail(input.email, input.password);
  }

  @Post('email/reset/request')
  requestEmailReset(@Body() input: VendorEmailResetRequestDto) {
    return this.vendorsService.requestVendorPasswordReset(input.email);
  }

  @Post('email/reset/confirm')
  confirmEmailReset(@Body() input: VendorEmailResetConfirmDto) {
    return this.vendorsService.confirmVendorPasswordReset(
      input.email,
      input.otp,
      input.newPassword,
    );
  }

  @Post('oauth/:provider/exchange')
  exchangeOauth(@Req() request: any, @Body() input: VendorOauthExchangeDto) {
    const provider = String(request.params.provider ?? '').toLowerCase();
    return this.vendorsService.exchangeVendorOauth(provider, input);
  }

  @Post('auth/refresh')
  refreshToken(@Body() input: VendorRefreshDto) {
    return this.vendorsService.refreshVendorToken(input.refreshToken);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor')
  @ApiBearerAuth()
  getStatus(@Req() request: any) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.vendorsService.getOnboardingStatus(vendorId);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor')
  @ApiBearerAuth()
  updateProfile(@Body() input: VendorProfileDto, @Req() request: any) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.vendorsService.updateVendorProfile(vendorId, input);
  }

  @Post('documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor')
  @ApiBearerAuth()
  uploadDocument(@Body() input: VendorDocumentDto, @Req() request: any) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.vendorsService.uploadVendorDocument(vendorId, input);
  }

  @Get('documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor')
  @ApiBearerAuth()
  listDocuments(@Req() request: any) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.vendorsService.listVendorDocuments(vendorId);
  }

  @Post('submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('vendor')
  @ApiBearerAuth()
  submit(@Req() request: any) {
    const vendorId = String(request.user.vendorId ?? request.user.sub);
    return this.vendorsService.submitForVerification(vendorId);
  }
}
