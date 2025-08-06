import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Button,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface ConfirmationEmailProps {
  supabase_url: string
  email_action_type: string
  redirect_to: string
  token_hash: string
  token: string
  user_email: string
}

export const ConfirmationEmail = ({
  token,
  supabase_url,
  email_action_type,
  redirect_to,
  token_hash,
  user_email,
}: ConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Confirme seu endereço de e-mail</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Confirme seu E-mail</Heading>
        <Text style={text}>
          Olá! Obrigado por se cadastrar em nossa plataforma.
        </Text>
        <Text style={text}>
          Para concluir seu cadastro, confirme seu endereço de e-mail clicando no botão abaixo:
        </Text>
        <Button
          href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
          style={button}
        >
          Confirmar E-mail
        </Button>
        <Text style={{ ...text, marginTop: '14px' }}>
          Ou copie e cole este link no seu navegador:
        </Text>
        <Link
          href={`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
          target="_blank"
          style={link}
        >
          {`${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`}
        </Link>
        <Text style={{ ...text, marginTop: '20px' }}>
          Código de confirmação: <code style={code}>{token}</code>
        </Text>
        <Text style={footer}>
          Se você não se cadastrou em nossa plataforma, pode ignorar este e-mail com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ConfirmationEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  border: '1px solid #e6ebf1',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  padding: '0 40px',
}

const button = {
  backgroundColor: '#007ee6',
  borderRadius: '4px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px',
  margin: '20px 40px',
}

const link = {
  color: '#007ee6',
  fontSize: '14px',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
  padding: '0 40px',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '20px 0 0 0',
  padding: '0 40px',
}

const code = {
  display: 'inline-block',
  padding: '8px 12px',
  backgroundColor: '#f4f4f4',
  borderRadius: '4px',
  border: '1px solid #e6ebf1',
  color: '#333',
  fontSize: '14px',
  fontFamily: 'monospace',
}