import { useState, useRef } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Popconfirm } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  DownloadOutlined,
  AudioOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { FileUpload } from '@/components/common/FileUpload';
import { voiceMessagesApi, type VoiceMessage } from '@/api/voice-messages.api';
import { formatDate, formatFileSize, formatDuration } from '@/utils/format';
import { colors } from '@/styles/theme';

function VoiceMessagesPage() {
  const queryClient = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [form] = Form.useForm();

  const handlePlay = async (id: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      const res = await voiceMessagesApi.downloadVoiceMessage(id);
      const url = window.URL.createObjectURL(res.data);
      const audio = new Audio(url);
      audioRef.current = audio;
      setPlayingId(id);

      audio.onended = () => {
        setPlayingId(null);
        window.URL.revokeObjectURL(url);
      };

      audio.play();
    } catch {
      message.error('Audio ijro etishda xatolik');
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['voice-messages'],
    queryFn: () => voiceMessagesApi.getVoiceMessages(),
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, name }: { file: File; name: string }) =>
      voiceMessagesApi.uploadVoiceMessage(file, name),
    onSuccess: () => {
      message.success('Ovozli xabar yuklandi');
      setUploadOpen(false);
      setSelectedFile(null);
      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ['voice-messages'] });
    },
    onError: () => message.error('Yuklashda xatolik'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => voiceMessagesApi.deleteVoiceMessage(id),
    onSuccess: () => {
      message.success('O\'chirildi');
      queryClient.invalidateQueries({ queryKey: ['voice-messages'] });
    },
  });

  const handleDownload = async (id: string, fileName: string) => {
    try {
      const res = await voiceMessagesApi.downloadVoiceMessage(id);
      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      message.error('Yuklab olishda xatolik');
    }
  };

  const voiceMessages: VoiceMessage[] = data?.data?.data || [];

  const columns = [
    {
      title: 'Nomi',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => (
        <Space>
          <AudioOutlined style={{ color: colors.primary }} />
          {v}
        </Space>
      ),
    },
    { title: 'Fayl', dataIndex: 'fileName', key: 'fileName' },
    {
      title: 'Hajmi',
      dataIndex: 'fileSize',
      key: 'fileSize',
      render: (v: number) => formatFileSize(v),
    },
    {
      title: 'Davomiyligi',
      dataIndex: 'duration',
      key: 'duration',
      render: (v: number) => formatDuration(v),
    },
    {
      title: 'Yuklangan',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => formatDate(v),
    },
    {
      title: 'Amallar',
      key: 'actions',
      width: 180,
      render: (_: unknown, r: VoiceMessage) => (
        <Space>
          <Button
            size="small"
            type={playingId === r.id ? 'primary' : 'default'}
            icon={playingId === r.id ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={() => handlePlay(r.id)}
          />
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(r.id, r.fileName)}
          />
          <Popconfirm
            title="O'chirmoqchimisiz?"
            onConfirm={() => deleteMutation.mutate(r.id)}
            okText="Ha"
            cancelText="Yo'q"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Ovozli xabarlar"
        subtitle="Ovozli qo'ng'iroqlar uchun audio fayllar"
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setUploadOpen(true)}>
            Yuklash
          </Button>
        }
      />

      <Table
        dataSource={voiceMessages}
        columns={columns}
        loading={isLoading}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />

      <Modal
        title="Ovozli xabar yuklash"
        open={uploadOpen}
        onCancel={() => { setUploadOpen(false); setSelectedFile(null); }}
        onOk={() => form.submit()}
        okText="Yuklash"
        cancelText="Bekor qilish"
        confirmLoading={uploadMutation.isPending}
        okButtonProps={{ disabled: !selectedFile }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(v) => {
            if (selectedFile) {
              uploadMutation.mutate({ file: selectedFile, name: v.name });
            }
          }}
        >
          <Form.Item name="name" label="Nomi" rules={[{ required: true, message: 'Nomini kiriting' }]}>
            <Input placeholder="Masalan: Tabriklash xabari" />
          </Form.Item>
          <FileUpload
            accept=".mp3,.wav,.ogg,.m4a"
            hint="MP3, WAV, OGG yoki M4A formatdagi audio fayl"
            maxSizeMB={20}
            onFile={(file) => setSelectedFile(file)}
          />
          {selectedFile && (
            <div style={{ marginTop: 8, fontSize: 13, color: colors.textSecondary }}>
              Tanlangan: {selectedFile.name} ({formatFileSize(selectedFile.size)})
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
}

export default VoiceMessagesPage;
