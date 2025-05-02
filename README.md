
# Face Recognition System

This project uses face-api.js for face recognition.

## Model Files Setup

For the face recognition to work properly, you need to download the model files and place them in the correct location:

1. Create a `models` directory in the `public` folder of your project
2. Download the following model files from the face-api.js repository:
   - face_landmark_68_model-weights_manifest.json
   - face_landmark_68_model-shard1
   - tiny_face_detector_model-weights_manifest.json
   - tiny_face_detector_model-shard1

3. Place the downloaded files in the `public/models` directory

You can download these files from:
https://github.com/justadudewhohacks/face-api.js/tree/master/weights

## Running the Project

1. Make sure you have installed the dependencies:
```bash
npm install face-api.js @tensorflow/tfjs
```

2. Start the development server:
```bash
npm run dev
```

3. Allow camera access when prompted by the browser

The server will run on port 8080 by default.
