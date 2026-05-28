"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Box, Paper, Typography, Button, Stack, TextField, CircularProgress,
  Alert, Divider, Table, TableHead, TableRow, TableCell, TableBody,
  Pagination, Chip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import NotificationsIcon from "@mui/icons-material/Notifications";

interface NotificationLog {
  id: string;
  title: string;
  body: string;
  url: string | null;
  sentCount: number;
  failCount: number;
  createdAt: string;
}

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);

  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchLogs = useCallback(async (p = 1) => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/push/history?page=${p}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(p);
      }
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), url: url.trim() || "/" }),
      });
      const data = await res.json();
      if (res.ok) {
        setSendResult({ ok: true, message: `발송 완료: ${data.sentCount}명 성공, ${data.failCount}명 실패` });
        setTitle("");
        setBody("");
        setUrl("");
        fetchLogs(1);
      } else {
        setSendResult({ ok: false, message: data.error || "발송 실패" });
      }
    } catch {
      setSendResult({ ok: false, message: "네트워크 오류" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 3 }}>
        <NotificationsIcon sx={{ color: "primary.main" }} />
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          알림 관리
        </Typography>
      </Stack>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          푸시 알림 발송
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ htmlInput: { maxLength: 50 } }}
            helperText={`${title.length}/50`}
          />
          <TextField
            label="내용"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={3}
            slotProps={{ htmlInput: { maxLength: 200 } }}
            helperText={`${body.length}/200`}
          />
          <TextField
            label="링크 URL (선택)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            fullWidth
            size="small"
            placeholder="예: /shop/products"
          />
          {sendResult && (
            <Alert severity={sendResult.ok ? "success" : "error"}>{sendResult.message}</Alert>
          )}
          <Box>
            <Button
              variant="contained"
              startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
            >
              {sending ? "발송 중..." : "전체 발송"}
            </Button>
          </Box>
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            발송 이력
          </Typography>
          <Typography variant="body2" color="text.secondary">
            총 {total}건
          </Typography>
        </Stack>
        <Divider sx={{ mb: 2 }} />

        {loadingLogs ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
            발송 이력이 없습니다
          </Typography>
        ) : (
          <>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>제목</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>내용</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>링크</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">성공</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">실패</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>발송시각</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.title}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.body}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {log.url || "-"}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={log.sentCount} size="small" color="success" />
                    </TableCell>
                    <TableCell align="center">
                      {log.failCount > 0 ? (
                        <Chip label={log.failCount} size="small" color="error" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">0</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(log.createdAt).toLocaleString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, p) => fetchLogs(p)}
                  color="primary"
                  size="small"
                />
              </Box>
            )}
          </>
        )}
      </Paper>
    </Box>
  );
}
