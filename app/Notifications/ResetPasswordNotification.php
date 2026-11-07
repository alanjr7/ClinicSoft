<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    /**
     * The password reset token.
     */
    public string $token;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $token)
    {
        $this->token = $token;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Build the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $resetUrl = url(route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        $expireMinutes = config('auth.passwords.users.expire', 60);
        $userName = trim(($notifiable->first_name ?? '') . ' ' . ($notifiable->last_name ?? ''));

        return (new MailMessage)
            ->subject('Restablecer Contraseña — ClinicSoft')
            ->greeting('Hola ' . ($userName ?: 'Doctor/a') . ',')
            ->line('Has recibido este correo electrónico porque se ha solicitado el restablecimiento de la contraseña para tu cuenta de ClinicSoft.')
            ->action('Restablecer mi Contraseña', $resetUrl)
            ->line("Este enlace es de uso único y caducará automáticamente en {$expireMinutes} minutos.")
            ->line('Si no has solicitado este restablecimiento, no te preocupes: puedes ignorar este correo y tu contraseña permanecerá segura.')
            ->salutation('El equipo de ClinicSoft');
    }
}

