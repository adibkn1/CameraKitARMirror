
import {
  bootstrapCameraKit,
  createMediaStreamSource,
} from '@snap/camera-kit';

(async function() { 
  const cameraKit = await bootstrapCameraKit({
    apiToken: 'eyJhbGciOiJIUzI1NiIsImtpZCI6IkNhbnZhc1MyU0hNQUNQcm9kIiwidHlwIjoiSldUIn0.eyJhdWQiOiJjYW52YXMtY2FudmFzYXBpIiwiaXNzIjoiY2FudmFzLXMyc3Rva2VuIiwibmJmIjoxNzA2NzExNzk4LCJzdWIiOiJhNWQ0ZjU2NC0yZTM0LTQyN2EtODI1Ni03OGE2NTFhODc0ZTR-U1RBR0lOR35mMzBjN2JmNy1lNjhjLTRhNzUtOWFlNC05NmJjOTNkOGIyOGYifQ.xLriKo1jpzUBAc1wfGpLVeQ44Ewqncblby-wYE1vRu0'
  });

  const session = await cameraKit.createSession();
  const canvasElement = document.getElementById('canvas');
  canvasElement.replaceWith(session.output.live);
  session.output.live.style.transform = 'scaleX(1)';

  const { lenses } = await cameraKit.lensRepository.loadLensGroups(['27bc13e7-8c84-4c0a-9b81-6c889b613d65']); // Replace '<GROUP_ID>' with your actual lens group ID
  session.applyLens(lenses[0]);

  let mediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'environment',
      width: { ideal: 3840, min: 1920 }, // 4K resolution as ideal, 1080p as minimum
      height: { ideal: 2160, min: 1080 } // 4K resolution as ideal, 1080p as minimum
    }
  });

  const source = createMediaStreamSource(mediaStream, { cameraType: 'back' });
  await session.setSource(source);
  session.source.setRenderSize(window.innerWidth, window.innerHeight);
  session.play();
})(); 

