import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../app/AuthProvider.jsx';
import { bookingApi } from '../../booking/bookingApi.js';

export default function VerifyTicketPage() {
  const { token } = useAuth();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const scanningRef = useRef(false);
  const [ticketCode, setTicketCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  function stopCamera() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    scanningRef.current = false;
    setScanning(false);
  }

  async function startCamera() {
    setError('');
    if (!('BarcodeDetector' in window)) {
      setError('QR scanning is not supported in this browser. Enter the ticket code manually.');
      return;
    }
    try {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScanning(true);
      timerRef.current = window.setInterval(async () => {
        if (scanningRef.current || !videoRef.current) return;
        scanningRef.current = true;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length) {
            setTicketCode(codes[0].rawValue);
            stopCamera();
          }
        } catch { setError('Could not read that QR code. Try again or enter the code manually.'); }
        finally { scanningRef.current = false; }
      }, 400);
    } catch (cameraError) {
      stopCamera();
      setError(cameraError.name === 'NotAllowedError' ? 'Camera permission was denied. Enter the ticket code manually.' : 'Could not open the camera. Enter the ticket code manually.');
    }
  }

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setResult(null);
    try { setResult(await bookingApi.verifyTicket(token, ticketCode.trim())); }
    catch (verifyError) { setError(verifyError.message); }
    finally { setBusy(false); }
  }

  return <section className="account-page">
    <Link className="back-link" to="/admin">← Admin dashboard</Link>
    <div className="page-heading"><p className="eyebrow eyebrow--dark"><span className="eyebrow__line" /> DOOR CHECK</p><h1>Verify ticket<span className="heading-dot">.</span></h1><p>Enter the verification code from the ticket PDF.</p></div>
    <div className="verify-panel">
      <div className="scanner-actions"><button className="button-secondary" type="button" onClick={scanning ? stopCamera : startCamera}>{scanning ? 'Stop camera' : 'Scan QR with camera'}</button><span className="muted">Or enter the code printed with the ticket.</span></div>
      <video className={`qr-camera${scanning ? '' : ' qr-camera--hidden'}`} ref={videoRef} playsInline muted aria-label="Camera QR scanner" />
      <form className="verify-form" onSubmit={submit}><label>Ticket code<input required value={ticketCode} onChange={(event) => setTicketCode(event.target.value)} placeholder="Paste or scan the ticket code" /></label><button className="button-primary" disabled={busy}>{busy ? 'Checking…' : 'Verify ticket'}</button></form>
      {error && <div className="form-error" role="alert">{error}</div>}
      {result && <div className={result.valid ? 'verification-result verification-result--valid' : 'verification-result verification-result--invalid'}><strong>{result.valid ? 'Valid ticket' : 'Ticket not valid'}</strong>{result.valid && <p>Booking {result.bookingReference} · Showtime #{result.showtimeId} · Seats {result.seatIds.join(', ')}</p>}</div>}
    </div>
  </section>;
}
