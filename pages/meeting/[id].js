// pages/meeting/[id].js
import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { v4 as uuidv4 } from 'uuid';
import { Box, Button, Container, IconButton, Tooltip, Typography } from '@mui/material';
import VideoCameraFrontIcon from '@mui/icons-material/VideoCameraFront';
import VideoCameraOffIcon from '@mui/icons-material/VideoCameraOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import CallEndIcon from '@mui/icons-material/CallEnd';

// Vercel API route socket endpoint
const socket = io({ path: '/api/socket' });

export default function Meeting() {
  const router = useRouter();
  const { id: meetingId } = router.query;
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [joined, setJoined] = useState(false);

  // No need for socket init effect – socket is already created above

  const router = useRouter();
  const { id: meetingId } = router.query;
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [joined, setJoined] = useState(false);

  // Initialize socket.io
  useEffect(() => {
    if (!socket) {
      socket = io(); // connects to same origin (Render will serve both)
    }
  }, []);

  // Get user media on mount
  useEffect(() => {
    async function initMedia() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(mediaStream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Could not get media', err);
      }
    }
    initMedia();
    return () => {
      // cleanup on unmount
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // When both socket and media are ready, join room and set up peer
  useEffect(() => {
    if (!meetingId || !socket || !stream) return;
    if (joined) return;
    socket.emit('join-room', meetingId);
    setJoined(true);

    // Determine if we are the initiator: first client becomes initiator
    const initiator = true; // simple approach: always initiator; peers will negotiate via signaling
    const peer = new SimplePeer({
      initiator,
      trickle: false,
      stream,
    });
    peerRef.current = peer;

    peer.on('signal', (payload) => {
      socket.emit('signal', { roomId: meetingId, payload });
    });

    socket.on('signal', ({ from, payload }) => {
      // Avoid processing our own signal
      if (from === socket.id) return;
      peer.signal(payload);
    });

    peer.on('stream', (remoteStream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    });

    peer.on('close', () => {
      console.log('Peer connection closed');
    });

    return () => {
      socket.off('signal');
      peer.destroy();
    };
  }, [meetingId, stream, joined]);

  const toggleVideo = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
    }
  };

  const startScreenShare = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = displayStream.getVideoTracks()[0];
      // Replace the video track in the peer
      if (peerRef.current) {
        peerRef.current.replaceTrack(stream.getVideoTracks()[0], screenTrack, stream);
      }
      // Show screen locally
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = displayStream;
      }
      // When screen sharing ends, revert to camera
      screenTrack.onended = async () => {
        const camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const camTrack = camStream.getVideoTracks()[0];
        if (peerRef.current) {
          peerRef.current.replaceTrack(screenTrack, camTrack, stream);
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      };
    } catch (err) {
      console.error('Screen share failed', err);
    }
  };

  const endCall = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    router.push('/');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Meeting ID: {meetingId}
      </Typography>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          style={{ width: '45%', border: '1px solid #ccc' }}
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: '45%', border: '1px solid #ccc' }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Tooltip title={videoEnabled ? 'Turn camera off' : 'Turn camera on'}>
          <IconButton color="primary" onClick={toggleVideo}>
            {videoEnabled ? <VideoCameraFrontIcon /> : <VideoCameraOffIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}>
          <IconButton color="primary" onClick={toggleAudio}>
            {audioEnabled ? <MicIcon /> : <MicOffIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Share screen">
          <IconButton color="primary" onClick={startScreenShare}>
            <ScreenShareIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="End call">
          <IconButton color="error" onClick={endCall}>
            <CallEndIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Container>
  );
}

