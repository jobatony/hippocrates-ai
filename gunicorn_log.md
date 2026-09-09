Sep 08 21:33:04 ip-172-31-44-105 gunicorn[7847]: WSGI app sent body bytes on a no-body response (method=HEAD status=404); dropping per RFC 9110.
Sep 08 21:33:04 ip-172-31-44-105 gunicorn[7847]:  - - [08/Sep/2026:21:33:04 +0000] "HEAD /.env HTTP/1.0" 404 0 "-" "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +claude-user@anthropic.com)"
Sep 08 21:33:05 ip-172-31-44-105 gunicorn[7848]: WSGI app sent body bytes on a no-body response (method=HEAD status=404); dropping per RFC 9110.
Sep 08 21:33:05 ip-172-31-44-105 gunicorn[7848]:  - - [08/Sep/2026:21:33:05 +0000] "HEAD /.env.local HTTP/1.0" 404 0 "-" "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +claude-user@anthropic.com)"
Sep 08 21:33:05 ip-172-31-44-105 gunicorn[7846]: WSGI app sent body bytes on a no-body response (method=HEAD status=404); dropping per RFC 9110.
Sep 08 21:33:05 ip-172-31-44-105 gunicorn[7846]:  - - [08/Sep/2026:21:33:05 +0000] "HEAD /.env.prod HTTP/1.0" 404 0 "-" "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +claude-user@anthropic.com)"
Sep 08 21:33:05 ip-172-31-44-105 gunicorn[7847]: WSGI app sent body bytes on a no-body response (method=HEAD status=404); dropping per RFC 9110.
Sep 08 21:33:05 ip-172-31-44-105 gunicorn[7847]:  - - [08/Sep/2026:21:33:05 +0000] "HEAD /.env.dev HTTP/1.0" 404 0 "-" "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +claude-user@anthropic.com)"
Sep 08 21:33:13 ip-172-31-44-105 gunicorn[7847]:  - - [08/Sep/2026:21:33:13 +0000] "GET /config.json HTTP/1.0" 404 179 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
Sep 08 21:33:13 ip-172-31-44-105 gunicorn[7846]:  - - [08/Sep/2026:21:33:13 +0000] "GET /api/config HTTP/1.0" 404 179 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
Sep 08 21:33:13 ip-172-31-44-105 gunicorn[7846]:  - - [08/Sep/2026:21:33:13 +0000] "GET /api/env HTTP/1.0" 404 179 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
Sep 08 21:33:13 ip-172-31-44-105 gunicorn[7846]:  - - [08/Sep/2026:21:33:13 +0000] "GET /.env.example HTTP/1.0" 404 179 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
Sep 08 21:33:13 ip-172-31-44-105 gunicorn[7846]:  - - [08/Sep/2026:21:33:13 +0000] "GET /.env.local HTTP/1.0" 404 179 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
Sep 08 21:33:13 ip-172-31-44-105 gunicorn[7847]:  - - [08/Sep/2026:21:33:13 +0000] "GET /config.js HTTP/1.0" 404 179 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
Sep 08 21:33:13 ip-172-31-44-105 gunicorn[7847]:  - - [08/Sep/2026:21:33:13 +0000] "GET /.env.production HTTP/1.0" 404 179 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
Sep 08 21:33:13 ip-172-31-44-105 gunicorn[7848]:  - - [08/Sep/2026:21:33:13 +0000] "GET /js/config.js HTTP/1.0" 404 179 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
Sep 08 21:33:14 ip-172-31-44-105 gunicorn[7846]:  - - [08/Sep/2026:21:33:14 +0000] "GET /js/env.js HTTP/1.0" 404 179 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
Sep 08 21:33:14 ip-172-31-44-105 gunicorn[7848]:  - - [08/Sep/2026:21:33:14 +0000] "GET / HTTP/1.0" 404 179 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
Sep 08 21:33:14 ip-172-31-44-105 gunicorn[7847]:  - - [08/Sep/2026:21:33:14 +0000] "GET /.env HTTP/1.0" 404 179 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
Sep 08 21:33:14 ip-172-31-44-105 gunicorn[7848]:  - - [08/Sep/2026:21:33:14 +0000] "GET /settings.js HTTP/1.0" 404 179 "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
Sep 08 21:38:31 ip-172-31-44-105 gunicorn[7840]: [2026-09-08 21:38:31 +0000] [7840] [INFO] Handling signal: term
Sep 08 21:38:31 ip-172-31-44-105 gunicorn[7846]: [2026-09-08 21:38:31 +0000] [7846] [INFO] Worker exiting (pid: 7846)
Sep 08 21:38:31 ip-172-31-44-105 systemd[1]: Stopping gunicorn.service - gunicorn daemon...
Sep 08 21:38:31 ip-172-31-44-105 gunicorn[7847]: [2026-09-08 21:38:31 +0000] [7847] [INFO] Worker exiting (pid: 7847)
Sep 08 21:38:31 ip-172-31-44-105 gunicorn[7848]: [2026-09-08 21:38:31 +0000] [7848] [INFO] Worker exiting (pid: 7848)
Sep 08 21:38:31 ip-172-31-44-105 gunicorn[7840]: [2026-09-08 21:38:31 +0000] [7840] [INFO] Worker (pid:7846) was sent SIGTERM!
Sep 08 21:38:31 ip-172-31-44-105 gunicorn[7840]: [2026-09-08 21:38:31 +0000] [7840] [INFO] Worker (pid:7847) was sent SIGTERM!
Sep 08 21:38:31 ip-172-31-44-105 gunicorn[7840]: [2026-09-08 21:38:31 +0000] [7840] [INFO] Worker (pid:7848) was sent SIGTERM!
Sep 08 21:38:31 ip-172-31-44-105 gunicorn[7840]: [2026-09-08 21:38:31 +0000] [7840] [INFO] Shutting down: Master
Sep 08 21:38:31 ip-172-31-44-105 systemd[1]: gunicorn.service: Deactivated successfully.
Sep 08 21:38:31 ip-172-31-44-105 systemd[1]: Stopped gunicorn.service - gunicorn daemon.
Sep 08 21:38:31 ip-172-31-44-105 systemd[1]: gunicorn.service: Consumed 4.046s CPU time over 6min 54.674s wall clock time, 251.7M memory peak.
Sep 08 21:38:31 ip-172-31-44-105 systemd[1]: Started gunicorn.service - gunicorn daemon.
Sep 08 21:38:32 ip-172-31-44-105 gunicorn[7899]: [2026-09-08 21:38:32 +0000] [7899] [INFO] Starting gunicorn 26.2.0
Sep 08 21:38:32 ip-172-31-44-105 gunicorn[7899]: [2026-09-08 21:38:32 +0000] [7899] [INFO] Listening at: unix:/home/ubuntu/hippocrates-ai/backend/hippocrates.sock (7899)
Sep 08 21:38:32 ip-172-31-44-105 gunicorn[7899]: [2026-09-08 21:38:32 +0000] [7899] [INFO] Using worker: sync
Sep 08 21:38:32 ip-172-31-44-105 gunicorn[7905]: [2026-09-08 21:38:32 +0000] [7905] [INFO] Booting worker with pid: 7905
Sep 08 21:38:32 ip-172-31-44-105 gunicorn[7906]: [2026-09-08 21:38:32 +0000] [7906] [INFO] Booting worker with pid: 7906
Sep 08 21:38:32 ip-172-31-44-105 gunicorn[7907]: [2026-09-08 21:38:32 +0000] [7907] [INFO] Booting worker with pid: 7907
Sep 08 21:38:32 ip-172-31-44-105 gunicorn[7899]: [2026-09-08 21:38:32 +0000] [7899] [INFO] Control socket listening at /home/ubuntu/.gunicorn/gunicorn.ctl
Sep 08 21:39:32 ip-172-31-44-105 gunicorn[7907]:  - - [08/Sep/2026:21:39:32 +0000] "OPTIONS /api/auth/register/ HTTP/1.0" 200 0 "https://hippocratesai.netlify.app/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"
Sep 08 21:39:33 ip-172-31-44-105 gunicorn[7905]:  - - [08/Sep/2026:21:39:33 +0000] "POST /api/auth/register/ HTTP/1.0" 400 50 "https://hippocratesai.netlify.app/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"
Sep 08 21:40:39 ip-172-31-44-105 gunicorn[7905]:  - - [08/Sep/2026:21:40:39 +0000] "POST /api/auth/register/ HTTP/1.0" 201 79 "https://hippocratesai.netlify.app/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"
Sep 08 21:40:59 ip-172-31-44-105 gunicorn[7907]:  - - [08/Sep/2026:21:40:59 +0000] "OPTIONS /api/auth/verify-email/ HTTP/1.0" 200 0 "https://hippocratesai.netlify.app/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"
Sep 08 21:41:00 ip-172-31-44-105 gunicorn[7905]:  - - [08/Sep/2026:21:41:00 +0000] "POST /api/auth/verify-email/ HTTP/1.0" 200 622 "https://hippocratesai.netlify.app/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"
Sep 08 21:41:00 ip-172-31-44-105 gunicorn[7907]:  - - [08/Sep/2026:21:41:00 +0000] "OPTIONS /api/auth/me/ HTTP/1.0" 200 0 "https://hippocratesai.netlify.app/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"
Sep 08 21:41:01 ip-172-31-44-105 gunicorn[7906]:  - - [08/Sep/2026:21:41:01 +0000] "GET /api/auth/me/ HTTP/1.0" 200 193 "https://hippocratesai.netlify.app/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"
Sep 08 21:41:01 ip-172-31-44-105 gunicorn[7907]:  - - [08/Sep/2026:21:41:01 +0000] "OPTIONS /api/materials/ HTTP/1.0" 200 0 "https://hippocratesai.netlify.app/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"
Sep 08 21:41:01 ip-172-31-44-105 gunicorn[7905]:  - - [08/Sep/2026:21:41:01 +0000] "GET /api/materials/ HTTP/1.0" 200 2 "https://hippocratesai.netlify.app/" "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"
Sep 08 21:41:31 ip-172-31-44-105 gunicorn[7905]:  - - [08/Sep/2026:21:41:31 +0000] "GET / HTTP/1.0" 404 179 "-" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"