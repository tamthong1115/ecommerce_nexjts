import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ResetPasswordEmailProps {
  url: string;
  userName?: string;
}

export const ResetPasswordEmail = ({
  url,
  userName,
}: ResetPasswordEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={h1}>Reset your password</Text>
        <Text style={text}>Hello {userName || 'there'},</Text>
        <Text style={text}>
          Someone recently requested a password change for your account. If this
          was you, you can set a new password here:
        </Text>
        <Section style={btnContainer}>
          <Button style={button} href={url}>
            Reset password
          </Button>
        </Section>
        <Text style={text}>
          If you don&#39;t want to change your password or didn&#39;t request
          this, just ignore and delete this message.
        </Text>
      </Container>
    </Body>
  </Html>
);

const main = { backgroundColor: '#ffffff', fontFamily: 'sans-serif' };
const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};
const h1 = { fontSize: '24px', fontWeight: 'bold' };
const text = { fontSize: '16px', lineHeight: '26px' };
const btnContainer = { textAlign: 'center' as const, marginTop: '20px' };
const button = {
  backgroundColor: '#5F51E8',
  borderRadius: '3px',
  color: '#fff',
  padding: '12px 20px',
  textDecoration: 'none',
};
