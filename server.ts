import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const PORT = 3000;

function getGenAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SYSTEM_INSTRUCTION_ROBOTICS = `You are a friendly, brilliant Senior Robotics & Machine Vision Architect and Canadian English educator ("Buddy from Canada, eh!").
You specialize in Qisda Corporation's Robotics R&D Engineering stack:
1. Autonomous Systems: Perception, Planning, Navigation (3D LiDAR, RGB Camera, Depth Camera, LWIR Thermal Camera, 6-axis IMU, FAST-LIVO2 SLAM, BEVFusion).
2. Motion Control: Locomotion, Manipulation, Whole-Body Control (Jetson AGX Orin, 1kHz EtherCAT, Integrated Joints, Pinocchio/Crocoddyl Riccati MPC, Diffusion Policy).
3. Hardware & Simulation: Pro/E (Creo) to Pixar OpenUSD, NVIDIA Isaac Lab Sim-to-Real, Battery BMS & Thermal Integration.
4. Rigorous ML Evaluation: Eliminating spatio-temporal data leakage, overfitting, and class imbalance bias using Matthews Correlation Coefficient (MCC), PR-AUC, and Logit-Adjusted Focal Loss.
5. Toddler-Friendly Canadian English: You can explain any advanced robotics equation or Big-O complexity so a 4-year-old in Canada understands it using warm Canadian analogies (Zambonis, Timbits, Maple Syrup, Beavers, Toques, Loonies, eh!).
6. Taiwan Legal Compliance: Adhering strictly to Taiwan's Trade Secrets Act (營業秘密法) and Copyright Act (著作權法) for clean-room open-source GitHub publishing.
Keep spoken responses concise, warm, clear, and engaging.`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  const httpServer = createServer(app);

  // WebSocket server for Gemini 3.8 Live API real-time voice conversations
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '/', `http://${request.headers.host}`).pathname;
    if (pathname === '/live') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', async (clientWs: WebSocket) => {
    let session: any = null;
    try {
      const ai = getGenAIClient();
      session = await ai.live.connect({
        model: 'gemini-3.8-live',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' },
            },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: SYSTEM_INSTRUCTION_ROBOTICS,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            if (clientWs.readyState !== WebSocket.OPEN) return;

            const parts = message.serverContent?.modelTurn?.parts || [];
            for (const part of parts) {
              if (part.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: 'audio',
                    audio: part.inlineData.data,
                  })
                );
              }
              if (part.text) {
                clientWs.send(
                  JSON.stringify({
                    type: 'text',
                    text: part.text,
                  })
                );
              }
            }

            const outTranscript = (message.serverContent as any)?.outputTranscription?.text;
            if (outTranscript) {
              clientWs.send(
                JSON.stringify({
                  type: 'transcript',
                  role: 'model',
                  text: outTranscript,
                })
              );
            }

            const inTranscript = (message.serverContent as any)?.inputTranscription?.text;
            if (inTranscript) {
              clientWs.send(
                JSON.stringify({
                  type: 'transcript',
                  role: 'user',
                  text: inTranscript,
                })
              );
            }

            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ type: 'interrupted', interrupted: true }));
            }
          },
          onerror: (err: any) => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: 'error',
                  error: err?.message || 'Live API session error occurred.',
                })
              );
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'status', status: 'closed' }));
            }
          },
        },
      });

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'status', status: 'connected' }));
      }
    } catch (error: any) {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            error: error?.message || 'Failed to initialize Gemini 3.8 Live session.',
          })
        );
      }
    }

    clientWs.on('message', (raw) => {
      if (!session) return;
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.audio) {
          session.sendRealtimeInput({
            audio: {
              data: msg.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        } else if (msg.text) {
          session.sendRealtimeInput({
            text: msg.text,
          });
        }
      } catch (err: any) {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(
            JSON.stringify({
              type: 'error',
              error: err?.message || 'Failed to forward input to Live session.',
            })
          );
        }
      }
    });

    clientWs.on('close', () => {
      if (session) {
        try {
          session.close();
        } catch {
          // ignore close errors
        }
      }
    });
  });

  // REST API endpoint for interactive Canadian Toddler / Robotics Q&A via Gemini
  app.post('/api/gemini/ask', async (req, res) => {
    try {
      const { prompt, mode } = req.body || {};
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required.' });
      }

      const ai = getGenAIClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction:
            mode === 'toddler'
              ? `${SYSTEM_INSTRUCTION_ROBOTICS}\nRespond strictly in cheerful Canadian English suitable for a smart 4-year-old toddler (using analogies like Timbits, Zambonis, Maple Syrup, Beavers, Toques, eh!), while keeping the underlying robotics math 100% accurate.`
              : SYSTEM_INSTRUCTION_ROBOTICS,
        },
      });

      return res.json({ text: response.text || '' });
    } catch (error: any) {
      return res.status(500).json({
        error: error?.message || 'Failed to generate response from Gemini API.',
      });
    }
  });

  // REST API endpoint for Legally Compliant GitHub Upload (under Taiwan Trade Secrets & Copyright Law)
  app.post('/api/github/upload', async (req, res) => {
    try {
      const {
        githubToken,
        repoName,
        isPrivate,
        description,
        files,
        taiwanComplianceConfirmed,
      } = req.body || {};

      if (!taiwanComplianceConfirmed) {
        return res.status(400).json({
          error:
            'Taiwan Legal Compliance attestation (營業秘密法 & 著作權法 Clean-Room Verification) must be confirmed before uploading.',
        });
      }

      if (!githubToken || !repoName) {
        return res.status(400).json({
          error: 'Both GitHub Personal Access Token and Repository Name are required for direct API upload.',
        });
      }

      const headers = {
        Authorization: `Bearer ${githubToken.trim()}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Qisda-Robotics-CleanRoom-Uploader',
      };

      // 1. Verify authenticated GitHub user
      const userResp = await fetch('https://api.github.com/user', { headers });
      if (!userResp.ok) {
        const errBody = await userResp.text();
        return res.status(userResp.status).json({
          error: `GitHub authentication failed (${userResp.status}): ${errBody}`,
        });
      }
      const userData = (await userResp.json()) as { login: string; html_url: string };
      const owner = userData.login;

      // 2. Create repository if it does not exist
      const cleanRepoName = repoName.trim().replace(/[^a-zA-Z0-9._-]/g, '-');
      let repoUrl = `https://github.com/${owner}/${cleanRepoName}`;

      const checkRepoResp = await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}`, {
        headers,
      });

      if (checkRepoResp.status === 404) {
        const createResp = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: cleanRepoName,
            description:
              description ||
              'Clean-room Robotics Vision & Whole-Body Control Reference Implementation (CVPR/ICCV/NeurIPS, Taiwan Trade Secrets Act & Copyright Act Compliant)',
            private: Boolean(isPrivate),
            auto_init: true,
          }),
        });

        if (!createResp.ok) {
          const createErr = await createResp.text();
          return res.status(createResp.status).json({
            error: `Failed to create repository (${createResp.status}): ${createErr}`,
          });
        }
        const createdRepo = (await createResp.json()) as { html_url: string };
        repoUrl = createdRepo.html_url;
      }

      // 3. Upload each file via Contents API
      const uploadedFiles: string[] = [];
      const fileEntries: Array<{ path: string; content: string }> = Array.isArray(files) ? files : [];

      for (const file of fileEntries) {
        const fileApiUrl = `https://api.github.com/repos/${owner}/${cleanRepoName}/contents/${file.path}`;
        let existingSha: string | undefined;

        const existingFileResp = await fetch(fileApiUrl, { headers });
        if (existingFileResp.ok) {
          const existingData = (await existingFileResp.json()) as { sha?: string };
          existingSha = existingData.sha;
        }

        const putResp = await fetch(fileApiUrl, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: `feat(clean-room): upload ${file.path} [Taiwan Trade Secrets & Copyright Act Compliant]`,
            content: Buffer.from(file.content, 'utf-8').toString('base64'),
            ...(existingSha ? { sha: existingSha } : {}),
          }),
        });

        if (!putResp.ok) {
          const putErr = await putResp.text();
          return res.status(putResp.status).json({
            error: `Failed uploading ${file.path}: ${putErr}`,
          });
        }
        uploadedFiles.push(file.path);
      }

      return res.json({
        success: true,
        owner,
        repoName: cleanRepoName,
        repoUrl,
        uploadedFiles,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      return res.status(500).json({
        error: error?.message || 'Unexpected error during GitHub upload.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
