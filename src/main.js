import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push, onValue } from 'firebase/database';
import {
  bootstrapCameraKit,
  createMediaStreamSource,
} from '@snap/camera-kit';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAv5H0-jgze_z1dvT8mHFRwusYXAiTSJgw",
  authDomain: "digitalrakhi-f8060.firebaseapp.com",
  databaseURL: "https://digitalrakhi-f8060-default-rtdb.firebaseio.com",
  projectId: "digitalrakhi-f8060",
  storageBucket: "digitalrakhi-f8060.appspot.com",
  messagingSenderId: "360526523502",
  appId: "1:360526523502:web:3e1af0fd17e9bb1ca5ca7f",
  measurementId: "G-FPJ5LHJEVS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

document.addEventListener('DOMContentLoaded', function() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (token) {
    showReceiverSide(token);
  } else {
    setupForm();
  }
});

function setupForm() {
  const form = document.getElementById('rakhiForm');

  if (form) {
    form.style.display = 'block';
    const receiverMessage = document.getElementById('receiverMessage');
    receiverMessage.style.display = 'none';

    form.addEventListener('submit', async function(event) {
      event.preventDefault();

      const sisterName = document.getElementById('sisterName').value.trim();
      const brotherName = document.getElementById('brotherName').value.trim();
      const email = document.getElementById('email').value.trim();
      const mobile = document.getElementById('mobile').value.trim();
      const termsAccepted = document.getElementById('terms').checked;

      if (!sisterName || !brotherName || !email || !mobile || !termsAccepted) {
        alert('Please fill out all fields and accept the terms.');
        return;
      }

      const token = generateToken(sisterName, email, mobile);

      try {
        const newPostRef = push(ref(database, 'rakhis'));
        await set(newPostRef, {
          sisterName,
          brotherName,
          email,
          mobile,
          token,
          createdAt: new Date().toISOString()
        });

        const uniqueLink = `${window.location.origin}${window.location.pathname}?token=${token}`;
        handleSharing(uniqueLink);
      } catch (error) {
        console.error('Error saving data or generating link:', error);
        alert('Failed to process your request. Please try again.');
      }
    });
  } else {
    console.error('Form element not found');
  }
}

function showReceiverSide(token) {
  const senderContainer = document.getElementById('senderContainer');
  const receiverContainer = document.getElementById('receiverContainer');
  const cameraContainer = document.getElementById('camera-container');

  senderContainer.style.display = 'none';
  receiverContainer.style.display = 'flex';

  const rakhiRef = ref(database, 'rakhis');
  onValue(rakhiRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const rakhiData = Object.values(data).find((entry) => entry.token === token);
      if (rakhiData) {
        document.getElementById('greeting').innerText = `${rakhiData.sisterName} sent this Digital Rakhi to ${rakhiData.brotherName} with love`;
        document.getElementById('greeting-overlay').innerText = `${rakhiData.sisterName} sent this Digital Rakhi to ${rakhiData.brotherName} with love`;

        receiverContainer.addEventListener('click', () => handleTap(receiverContainer, cameraContainer));
      } else {
        document.getElementById('greeting').innerText = 'No Rakhi information found.';
        document.getElementById('greeting-overlay').innerText = 'No Rakhi information found.';
      }
    }
  }, (error) => {
    console.error('Error fetching data:', error);
    document.getElementById('greeting').innerText = 'Failed to retrieve Rakhi information.';
    document.getElementById('greeting-overlay').innerText = 'Failed to retrieve Rakhi information.';
  });
}

// Function to handle tap event and transition to camera
async function handleTap(receiverContainer, cameraContainer) {
  try {
    await startCameraKit();

    cameraContainer.style.display = 'flex';
    receiverContainer.style.opacity = 0;
    cameraContainer.style.opacity = 1;
    setTimeout(() => {
      receiverContainer.style.display = 'none';
    }, 1000);

  } catch (error) {
    console.error('Error initializing camera:', error);
  }
}

function generateToken(name, email, mobile) {
  return btoa(`${name.slice(0, 3)}${mobile.slice(-4)}`);
}

function handleSharing(link) {
  if (navigator.share) {
    navigator.share({
      title: 'Send Digital Rakhi',
      text: 'Check out this digital Rakhi I sent you!',
      url: link
    }).then(() => console.log('Thanks for sharing!'))
    .catch(err => console.error('Error sharing:', err));
  } else {
    navigator.clipboard.writeText(link)
    .then(() => {
      alert('Link copied to clipboard! Please share manually.');
      console.log('Link copied to clipboard!');
    })
    .catch(err => {
      console.error('Failed to copy link:', err);
      alert('Failed to copy link. Please try manually.');
    });
  }
}

// Function to start Camera Kit
async function startCameraKit() {
  const cameraContainer = document.getElementById('camera-container');
  cameraContainer.style.opacity = 1;

  try {
    const cameraKit = await bootstrapCameraKit({
      apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzA2NzExNzk4LCJzdWIiOiJhNWQ0ZjU2NC0yZTM0LTQyN2EtODI1Ni03OGE2NTFhODc0ZTR-U1RBR0lOR35mMzBjN2JmNy1lNjhjLTRhNzUtOWFlNC05NmJjOTNkOGIyOGYifQ.xLriKo1jpzUBAc1wfGpLVeQ44Ewqncblby-wYE1vRu0'
    });

    const session = await cameraKit.createSession();
    const canvasElement = document.getElementById('canvas');
    if (canvasElement) {
      canvasElement.replaceWith(session.output.live);
      session.output.live.style.transform = 'scaleX(1)';

      const { lenses } = await cameraKit.lensRepository.loadLensGroups(['27bc13e7-8c84-4c0a-9b81-6c889b613d65']);
      session.applyLens(lenses[0]);

      let mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 3840, min: 1920 },
          height: { ideal: 2160, min: 1080 }
        }
      });

      const source = createMediaStreamSource(mediaStream, { cameraType: 'back' });
      await session.setSource(source);
      session.source.setRenderSize(window.innerWidth, window.innerHeight);
      session.play();

    // Add event listener for the capture button
    document.getElementById('captureButton').addEventListener('click', () => captureScreenshot(session));
  } else {
    console.error('Canvas element not found');
  }
} catch (error) {
  console.error('Error initializing camera kit or session:', error);
}
}

// Function to capture screenshot
function captureScreenshot(session) {
  const liveOutput = session.output.live;

  if (liveOutput) {
    // Create a temporary canvas to draw the current frame
    const tempCanvas = document.createElement('canvas');
    const context = tempCanvas.getContext('2d');
    tempCanvas.width = liveOutput.clientWidth;  // Use clientWidth for dimensions
    tempCanvas.height = liveOutput.clientHeight;  // Use clientHeight for dimensions

    context.drawImage(liveOutput, 0, 0, tempCanvas.width, tempCanvas.height);

    // Convert the canvas content to a blob
    tempCanvas.toBlob((blob) => {
      if (!blob) {
        console.error('Failed to create blob from canvas');
        return;
      }

      // Create a file object from the blob
      const file = new File([blob], 'digital_rakhi_screenshot.png', { type: 'image/png' });

      // Check if sharing is supported
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({
          files: [file],
          title: 'Digital Rakhi',
          text: 'Check out this cool digital Rakhi!',
        }).then(() => {
          console.log('Shared successfully');
        }).catch((error) => {
          console.error('Error sharing:', error);
          // If sharing fails, download the file
          downloadImage(blob);
        });
      } else {
        // If sharing isn't supported, download the file
        downloadImage(blob);
      }
    }, 'image/png');
  } else {
    console.error('Live output element is not available');
  }
}

// Function to download the image if sharing isn't supported
function downloadImage(blob) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'digital_rakhi_screenshot.png';
  link.click();
}
