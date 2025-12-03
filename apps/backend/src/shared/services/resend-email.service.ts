import { Injectable, Inject } from '@nestjs/common';
import { IEmailService } from '@fnd/backend';
import { IConfigurationService } from '@fnd/backend';
import { Resend } from 'resend';

@Injectable()
export class ResendEmailService implements IEmailService {
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor(@Inject('IConfigurationService') private readonly configurationService: IConfigurationService) {
    const apiKey = this.configurationService.getResendApiKey();
    this.resend = new Resend(apiKey);
    this.fromEmail = this.configurationService.getResendFromEmail();
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    await this.resend.emails.send({
      from: this.fromEmail,
      to,
      subject,
      html: body,
    });
  }

  async sendEmailTemplate(to: string, templateId: string, variables: Record<string, any>): Promise<void> {
    const templates = {
      'welcome': this.getWelcomeTemplate(variables),
      'email-confirmation': this.getEmailConfirmationTemplate(variables),
      'password-reset': this.getPasswordResetTemplate(variables),
    };

    const template = templates[templateId as keyof typeof templates];
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    await this.sendEmail(to, template.subject, template.html);
  }

  private getWelcomeTemplate(variables: Record<string, any>) {
    return {
      subject: `Bem-vindo ao Rugido Digital, ${variables.name}!`,
      html: `
        <h1>Bem-vindo ao Rugido Digital!</h1>
        <p>Olá ${variables.name},</p>
        <p>Sua conta foi criada com sucesso. Agora você pode começar a gerenciar seus pacientes e atendimentos.</p>
        <p>Equipe Rugido Digital</p>
      `,
    };
  }

  private getEmailConfirmationTemplate(variables: Record<string, any>) {
    return {
      subject: 'Confirme seu email - Rugido Digital',
      html: `
        <h1>Confirme seu email</h1>
        <p>Olá ${variables.name},</p>
        <p>Por favor, confirme seu email clicando no link abaixo:</p>
        <a href="${variables.confirmationUrl}">Confirmar Email</a>
        <p>Este link expira em 24 horas.</p>
        <p>Equipe Rugido Digital</p>
      `,
    };
  }

  private getPasswordResetTemplate(variables: Record<string, any>) {
    return {
      subject: 'Redefinir senha - Rugido Digital',
      html: `
        <h1>Redefinir senha</h1>
        <p>Olá ${variables.name},</p>
        <p>Recebemos uma solicitação para redefinir sua senha. Clique no link abaixo:</p>
        <a href="${variables.resetUrl}">Redefinir Senha</a>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou isso, ignore este email.</p>
        <p>Equipe Rugido Digital</p>
      `,
    };
  }
}