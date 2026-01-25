import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface VerifyEmailProps {
  otp: string;
}

export const VerifyEmail = ({ otp }: VerifyEmailProps) => (
  <Html>
    <Head />
    <Preview>Your verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Verify your email</Heading>
        <Text style={text}>Your verification code is:</Text>
        <Section style={codeBox}>
          <Text style={code}>{otp}</Text>
        </Section>
        <Text style={text}>
          If you didn&#39;t request this, you can ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
);

// Styles
const main = { backgroundColor: '#ffffff', fontFamily: 'sans-serif' };
const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};
const h1 = { fontSize: '24px', fontWeight: 'bold', padding: '17px 0 0' };
const text = { fontSize: '16px', lineHeight: '26px' };
const codeBox = {
  background: '#f4f4f4',
  borderRadius: '4px',
  padding: '24px',
  textAlign: 'center' as const,
};
const code = { fontSize: '32px', fontWeight: 'bold', letterSpacing: '6px' };
