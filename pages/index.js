import React from 'react';
import { useRouter } from 'next/router';
import { v4 as uuidv4 } from 'uuid';
import { Button, Container, Typography, Box, IconButton, Tooltip, TextField } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

export default function Home() {
  const router = useRouter();
  const [meetingLink, setMeetingLink] = React.useState('');

  const startMeeting = () => {
    const meetingId = uuidv4();
    const link = `${window.location.origin}/meeting/${meetingId}`;
    setMeetingLink(link);
    router.push(`/meeting/${meetingId}`);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingLink);
      alert('Link copied to clipboard');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ textAlign: 'center', mt: 8 }}>
      <Typography variant="h3" gutterBottom>
        Google Meet Replica
      </Typography>
      <Box mt={4}>
        <Button variant="contained" size="large" onClick={startMeeting}>
          Start Meeting
        </Button>
      </Box>
      {meetingLink && (
        <Box mt={2} display="flex" alignItems="center" justifyContent="center">
          <TextField
            size="small"
            value={meetingLink}
            InputProps={{ readOnly: true }}
            sx={{ width: '80%' }}
          />
          <Tooltip title="Copy link">
            <IconButton onClick={copyLink} sx={{ ml: 1 }}>
              <ContentCopyIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Container>
  );
}

