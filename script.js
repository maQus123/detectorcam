const video = document.getElementById('video');

video.addEventListener('play', () => {
  drawDetections();
});

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
  faceapi.nets.ageGenderNet.loadFromUri('/models')
]).then(startVideo);

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  );
};

function drawDetections() {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);
  setInterval(async () => {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions().withAgeAndGender();
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    resizedDetections.forEach(resizedDetection => {
      var text = [];
      text.push(`${Math.round(resizedDetection.age)} Jahre`);
      text.push((resizedDetection.gender == 'male') ? 'Männlich' : 'Weiblich');
      const emotions = resizedDetection.expressions, min = 0.3;
      if (emotions.angry > min) text.push('Wütend');
      if (emotions.disgusted > min) text.push('Ekel');
      if (emotions.fearful > min) text.push('Ängstlich');
      if (emotions.happy > min) text.push('Glücklich');
      if (emotions.neutral > min) text.push('Neutral');
      if (emotions.sad > min) text.push('Traurig');
      if (emotions.surprised > min) text.push('Überrascht');
      new faceapi.draw.DrawTextField(text, resizedDetection.detection.box.bottomLeft).draw(canvas);
    });
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
  }, 100);
};