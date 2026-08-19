import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

type Level = 'INFO' | 'WARNING' | 'CRITICAL';

interface SystemReminderProps {
  title: string;
  message: string;
  level?: Level;
  actionUrl?: string;
  actionLabel?: string;
}

const themeColors: Record<Level, { bg: string; fg: string }> = {
  INFO: { bg: '#5977f2', fg: '#ffffff' },
  WARNING: { bg: '#cdb644', fg: '#3b3b18' },
  CRITICAL: { bg: '#c41e3a', fg: '#ffffff' },
} as const;

export function SystemReminderEmail({
  title,
  message,
  level = 'INFO',
  actionUrl,
  actionLabel,
}: SystemReminderProps) {
  const badgeColors = themeColors[level];

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>System Reminder</Heading>
          <Section style={{ marginTop: 8 }}>
            <Text
              style={{
                ...pill,
                backgroundColor: badgeColors.bg,
                color: badgeColors.fg,
              }}
            >
              {level}
            </Text>
          </Section>
          <Heading style={h2}>{title}</Heading>
          <Text style={text}>{message}</Text>
          {actionUrl ? (
            <Section style={btnContainer}>
              <Button style={button} href={actionUrl}>
                {actionLabel ?? 'View details'}
              </Button>
            </Section>
          ) : null}
          <Text style={footer}>
            This is an automated email, please do not reply.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: '#ffffff', fontFamily: 'sans-serif' };
const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};
const h1 = { fontSize: '20px', fontWeight: 'bold', margin: '0 0 12px' };
const h2 = { fontSize: '18px', fontWeight: 'bold', margin: '12px 0 8px' };
const text = { fontSize: '16px', lineHeight: '26px', margin: '0' };
const pill = {
  display: 'inline-block',
  fontSize: '12px',
  fontWeight: 700,
  padding: '6px 10px',
  borderRadius: '999px',
  margin: '0',
};
const btnContainer = { textAlign: 'center' as const, marginTop: '20px' };
const button = {
  backgroundColor: '#111827',
  borderRadius: '6px',
  color: '#fff',
  padding: '12px 18px',
  textDecoration: 'none',
};
const footer = {
  fontSize: '12px',
  lineHeight: '20px',
  color: '#6b7280',
  marginTop: '28px',
};
