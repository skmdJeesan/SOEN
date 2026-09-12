import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const send_project_invite_email = async ({ to_email, owner_name, project_name }) => {
  const project_link = `${process.env.FRONTEND_URL}`

  const { error } = await resend.emails.send({
    from: 'SOEN <noreply@skmdjeesan.me>', // your verified Resend domain
    to: to_email,
    subject: `You've been added to ${project_name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>You're in!</h2>
        <p><b>${owner_name}</b> added you to the project <b>${project_name}</b>.</p>
        <a href="${project_link}" style="display:inline-block; padding:10px 20px; background:#E8B34A; color:#05070C; text-decoration:none; border-radius:6px; margin-top:12px;">
          Open Project
        </a>
        <p style="margin-top:16px; color:#888; font-size:12px;">If you weren't expecting this, you can ignore this email.</p>
      </div>
    `
  })
  if (error) throw new Error(error.message)
}