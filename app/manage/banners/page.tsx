"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box, Paper, Typography, Button, Stack, IconButton, Switch, TextField,
  CircularProgress, Chip, FormControl, InputLabel, Select, MenuItem, OutlinedInput,
  Checkbox, ListItemText, Alert, Tooltip, Drawer, Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ImageIcon from "@mui/icons-material/Image";
import ViewCarouselIcon from "@mui/icons-material/ViewCarousel";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Factory { id: string; name: string }
interface Banner {
  id: string; imageUrl: string; linkUrl: string | null; title: string | null;
  content: string | null; isActive: boolean; sortOrder: number; factoryIds: string[];
  startDate: string | null; endDate: string | null;
}

const DRAWER_WIDTH = 500;
const emptyForm = () => ({
  imageUrl: "", linkUrl: "", title: "", content: "", factoryIds: [] as string[],
  sortOrder: 0, startDate: "", endDate: "",
});

const toDateInput = (s: string | null) => s ? s.slice(0, 10) : "";
const isExpired = (b: Banner) => !!b.endDate && new Date(b.endDate) < new Date();
const isNotStarted = (b: Banner) => !!b.startDate && new Date(b.startDate) > new Date();

function SortableRow({
  banner, idx, factories, onToggle, onEdit, onDelete,
}: {
  banner: Banner; idx: number; factories: Factory[];
  onToggle: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: banner.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const expired = isExpired(banner);
  const notStarted = isNotStarted(banner);

  return (
    <Box ref={setNodeRef} style={style} sx={{ bgcolor: isDragging ? "#f5f5f5" : "transparent" }}>
      {/* 윗줄: 정보 + 컨트롤 */}
      <Stack direction="row" sx={{ alignItems: "center", px: 1, py: 1.2 }}>
        {/* 드래그 핸들 */}
        <Box {...attributes} {...listeners} sx={{ width: 32, flexShrink: 0, textAlign: "center", cursor: "grab", color: "text.disabled", "&:active": { cursor: "grabbing" } }}>
          <DragIndicatorIcon fontSize="small" />
        </Box>

        {/* 순서 번호 */}
        <Typography variant="caption" sx={{ color: "text.disabled", fontWeight: 700, width: 20, flexShrink: 0, textAlign: "center" }}>
          {/* idx는 부모에서 전달 안 함 — sortOrder로 표시 불가, 빈칸 */}
        </Typography>

        {/* 제목 */}
        <Typography variant="body2" sx={{ fontWeight: 700, flex: 1, minWidth: 0 }} noWrap>
          {banner.title || <Box component="span" sx={{ color: "text.disabled" }}>(제목 없음)</Box>}
        </Typography>

        {/* 기간 */}
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", flexShrink: 0, mx: 1.5 }}>
          {banner.startDate || banner.endDate ? (
            <Typography variant="caption" sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
              {banner.startDate ? toDateInput(banner.startDate) : "∞"} ~ {banner.endDate ? toDateInput(banner.endDate) : "∞"}
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ color: "text.disabled" }}>기간 없음</Typography>
          )}
          {expired && <Chip label="만료" size="small" color="error" sx={{ height: 18, fontSize: 10 }} />}
          {notStarted && <Chip label="예약" size="small" color="info" sx={{ height: 18, fontSize: 10 }} />}
        </Stack>

        {/* 노출 매장 */}
        <Box sx={{ flexShrink: 0, mx: 1, display: { xs: "none", sm: "block" } }}>
          {banner.factoryIds.length === 0 || banner.factoryIds.length >= factories.length ? (
            <Chip label="전체 매장" size="small" sx={{ bgcolor: "#e8eaf6", color: "#1a237e", fontWeight: 600 }} />
          ) : banner.factoryIds.length === 1 ? (
            <Chip label={factories.find((x) => x.id === banner.factoryIds[0])?.name || "-"} size="small" variant="outlined" />
          ) : (
            <Chip label={`${banner.factoryIds.length}개 매장`} size="small" variant="outlined" />
          )}
        </Box>

        {/* 활성 토글 */}
        <Switch checked={banner.isActive && !expired} onChange={onToggle} size="small" color="primary" disabled={expired} sx={{ flexShrink: 0 }} />

        {/* 편집/삭제 */}
        <Stack direction="row" spacing={0} sx={{ flexShrink: 0, alignItems: "center" }}>
          <IconButton size="small" onClick={onEdit} sx={{ color: "primary.main" }}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={onDelete} sx={{ color: "error.main" }}><DeleteIcon fontSize="small" /></IconButton>
        </Stack>
      </Stack>

      {/* 아랫줄: 배너 이미지 */}
      <Box sx={{ mx: 2, mb: 1.5, borderRadius: 1.5, overflow: "hidden", aspectRatio: "16/5", bgcolor: "#f5f5f5" }}>
        <Box component="img" src={banner.imageUrl} alt={banner.title || "배너"}
          sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </Box>
    </Box>
  );
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    Promise.all([
      fetch("/api/banners?manage=1").then((r) => r.json()),
      fetch("/api/factories").then((r) => r.json()),
    ]).then(([b, f]) => {
      setBanners(Array.isArray(b) ? b.sort((a: Banner, b: Banner) => a.sortOrder - b.sortOrder) : []);
      setFactories(Array.isArray(f) ? f : []);
      setLoading(false);
    });
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setError("");
    setDrawerOpen(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      imageUrl: b.imageUrl, linkUrl: b.linkUrl || "", title: b.title || "",
      content: b.content || "", factoryIds: b.factoryIds, sortOrder: b.sortOrder,
      startDate: toDateInput(b.startDate), endDate: toDateInput(b.endDate),
    });
    setError("");
    setDrawerOpen(true);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const signRes = await fetch("/api/upload/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name }),
      });
      const { signedUrl, publicUrl, error: signErr } = await signRes.json();
      if (signErr) throw new Error(signErr);

      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "image/jpeg" },
        body: file,
      });
      if (!uploadRes.ok) throw new Error(`업로드 실패 (${uploadRes.status})`);

      setForm((f) => ({ ...f, imageUrl: publicUrl }));
    } catch (e: any) {
      setError(e.message || "업로드 중 오류가 발생했습니다");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.imageUrl) { setError("이미지를 업로드해주세요"); return; }
    setSaving(true);
    const payload = {
      imageUrl: form.imageUrl,
      linkUrl: form.linkUrl || null,
      title: form.title || null,
      content: form.content || null,
      factoryIds: form.factoryIds,
      sortOrder: Number(form.sortOrder),
      startDate: form.startDate || null,
      endDate: form.endDate || null,
      isActive: true,
    };
    const res = editing
      ? await fetch(`/api/banners/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch("/api/banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "저장 실패"); return; }
    setBanners((prev) =>
      editing
        ? prev.map((b) => b.id === editing.id ? data : b).sort((a, b) => a.sortOrder - b.sortOrder)
        : [...prev, data].sort((a, b) => a.sortOrder - b.sortOrder)
    );
    setDrawerOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("배너를 삭제하시겠습니까?")) return;
    await fetch(`/api/banners/${id}`, { method: "DELETE" });
    setBanners((prev) => prev.filter((b) => b.id !== id));
  };

  const handleToggle = async (b: Banner) => {
    const res = await fetch(`/api/banners/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    const data = await res.json();
    setBanners((prev) => prev.map((x) => x.id === b.id ? data : x));
  };

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setBanners((prev) => {
      const oldIdx = prev.findIndex((b) => b.id === active.id);
      const newIdx = prev.findIndex((b) => b.id === over.id);
      const next = arrayMove(prev, oldIdx, newIdx);
      // persist new sort orders
      next.forEach((b, i) => {
        b.sortOrder = i;
        fetch(`/api/banners/${b.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: i }),
        });
      });
      return [...next];
    });
  }, []);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto" }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <ViewCarouselIcon sx={{ color: "#1a237e" }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>배너 관리</Typography>
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
          sx={{ bgcolor: "#1a237e", "&:hover": { bgcolor: "#283593" }, textTransform: "none", fontWeight: 700 }}>
          배너 추가
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>
      ) : banners.length === 0 ? (
        <Paper elevation={0} sx={{ border: "1px dashed #ddd", borderRadius: 2, py: 8, textAlign: "center" }}>
          <ImageIcon sx={{ fontSize: 56, color: "#ccc", mb: 1 }} />
          <Typography color="text.secondary">등록된 배너가 없습니다</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate} sx={{ mt: 2, textTransform: "none" }}>
            첫 번째 배너 추가
          </Button>
        </Paper>
      ) : (
        <Paper elevation={0} sx={{ border: "1px solid #e0e0e0", borderRadius: 2, overflow: "hidden" }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={banners.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {banners.map((b, idx) => (
                <Box key={b.id}>
                  {idx > 0 && <Divider />}
                  <SortableRow
                    banner={b}
                    idx={idx}
                    factories={factories}
                    onToggle={() => handleToggle(b)}
                    onEdit={() => openEdit(b)}
                    onDelete={() => handleDelete(b.id)}
                  />
                </Box>
              ))}
            </SortableContext>
          </DndContext>
        </Paper>
      )}

      {/* Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        variant="persistent"
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "100vw", sm: DRAWER_WIDTH },
            position: "fixed", top: 64,
            height: "calc(100vh - 64px)",
            boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
            borderLeft: "1px solid #e0e0e0",
          },
        }}
      >
        {/* 헤더 */}
        <Box sx={{ px: 3, py: 2, bgcolor: "#1a237e", color: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              {editing ? "배너 수정" : "배너 추가"}
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
              {editing ? editing.title || "(제목 없음)" : "새 배너를 등록합니다"}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained" startIcon={saving ? undefined : <SaveIcon />} onClick={handleSave}
              disabled={saving || uploading}
              sx={{ bgcolor: "#fff", color: "#1a237e", "&:hover": { bgcolor: "#e8eaf6" }, textTransform: "none", fontWeight: 700 }}
            >
              {saving ? <CircularProgress size={18} color="inherit" /> : "저장"}
            </Button>
            <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: "#fff" }}><CloseIcon /></IconButton>
          </Stack>
        </Box>

        {/* 내용 */}
        <Box sx={{ overflowY: "auto", flex: 1, px: 3, py: 2.5 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

          {/* 기본 정보 */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", mb: 1.5 }}>기본 정보</Typography>
          <Stack spacing={2}>
            <TextField label="배너 제목" size="small" fullWidth value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            <Stack direction="row" spacing={1.5}>
              <TextField
                label="표시 시작일" size="small" type="date" fullWidth
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label="표시 종료일" size="small" type="date" fullWidth
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
            <TextField
              label="배너 내용" size="small" fullWidth multiline rows={3}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="배너에 표시할 내용 (선택)"
            />
            <TextField label="링크 URL (선택)" size="small" fullWidth value={form.linkUrl}
              placeholder="https://..." onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))} />
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* 배너 이미지 */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", mb: 1.5 }}>배너 이미지</Typography>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
          <Box
            onClick={() => fileRef.current?.click()}
            sx={{
              border: "2px dashed #ccc", borderRadius: 2, height: 160, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", position: "relative",
              "&:hover": { borderColor: "primary.main", bgcolor: "#f5f8ff" },
            }}
          >
            {uploading ? (
              <CircularProgress size={32} />
            ) : form.imageUrl ? (
              <Box component="img" src={form.imageUrl} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <>
                <CloudUploadIcon sx={{ fontSize: 40, color: "#bbb", mb: 1 }} />
                <Typography variant="body2" color="text.secondary">클릭하여 이미지 업로드</Typography>
                <Typography variant="caption" color="text.disabled">권장 비율 16:5 (예: 1600×500)</Typography>
              </>
            )}
          </Box>
          {form.imageUrl && (
            <Button size="small" onClick={() => fileRef.current?.click()} sx={{ mt: 0.5, textTransform: "none" }}>
              이미지 변경
            </Button>
          )}

          <Divider sx={{ my: 3 }} />

          {/* 노출 매장 */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main", mb: 1.5 }}>노출 매장</Typography>
          <FormControl size="small" fullWidth>
            <InputLabel>노출 매장 (미선택 시 전체)</InputLabel>
            <Select
              multiple
              value={form.factoryIds}
              onChange={(e) => setForm((f) => ({ ...f, factoryIds: e.target.value as string[] }))}
              input={<OutlinedInput label="노출 매장 (미선택 시 전체)" />}
              renderValue={(selected) =>
                selected.map((id) => factories.find((f) => f.id === id)?.name).filter(Boolean).join(", ")
              }
            >
              {factories.map((f) => (
                <MenuItem key={f.id} value={f.id}>
                  <Checkbox checked={form.factoryIds.includes(f.id)} size="small" />
                  <ListItemText primary={f.name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Drawer>
    </Box>
  );
}
