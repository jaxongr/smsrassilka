import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, Space, Spin, Select, message } from 'antd';
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { PageHeader } from '@/components/common/PageHeader';
import { inboxApi } from '@/api/inbox.api';
import { devicesApi } from '@/api/devices.api';
import { formatDate, formatPhone } from '@/utils/format';
import { colors } from '@/styles/theme';
import type { InboxMessage } from '@/types/inbox.types';

const ChatContainer = styled.div`
  max-width: 700px;
  margin: 0 auto;
`;

const MessagesArea = styled.div`
  max-height: 500px;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MessageBubble = styled.div<{ $incoming: boolean }>`
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  align-self: ${(p) => (p.$incoming ? 'flex-start' : 'flex-end')};
  background: ${(p) => (p.$incoming ? '#F3F4F6' : colors.primaryBg)};
  color: ${colors.textPrimary};
`;

const MsgTime = styled.div`
  font-size: 11px;
  color: ${colors.textHint};
  margin-top: 4px;
`;

const ReplyArea = styled.div`
  display: flex;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid ${colors.cardBorder};
  align-items: flex-end;
`;

function ConversationPage() {
  const { phone } = useParams<{ phone: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const [selectedDevice, setSelectedDevice] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const phoneNumber = decodeURIComponent(phone || '');

  const { data, isLoading } = useQuery({
    queryKey: ['conversation', phoneNumber],
    queryFn: () => inboxApi.getConversation(phoneNumber),
    enabled: !!phoneNumber,
  });

  const { data: devicesData } = useQuery({
    queryKey: ['devices'],
    queryFn: () => devicesApi.getDevices(),
  });

  const replyMut = useMutation({
    mutationFn: ({ msgId, body }: { msgId: string; body: string }) =>
      inboxApi.replyToMessage(msgId, body, selectedDevice),
    onSuccess: () => {
      message.success('Javob yuborildi');
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['conversation', phoneNumber] });
    },
    onError: () => message.error('Yuborishda xatolik'),
  });

  const messages: InboxMessage[] = data?.data?.messages || [];
  const devices = devicesData?.data || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const lastMsg = messages[messages.length - 1];

  return (
    <div>
      <PageHeader
        title={formatPhone(phoneNumber)}
        subtitle="Suhbat tarixi"
        actions={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/inbox')}>
            Orqaga
          </Button>
        }
      />

      <ChatContainer>
        <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin />
            </div>
          ) : (
            <MessagesArea>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} $incoming={true}>
                  {msg.body}
                  <MsgTime>
                    {formatDate(msg.receivedAt)} - {msg.deviceName} (SIM {msg.simSlot})
                  </MsgTime>
                </MessageBubble>
              ))}
              <div ref={messagesEndRef} />
            </MessagesArea>
          )}

          <ReplyArea>
            <Select
              placeholder="Qurilma"
              value={selectedDevice}
              onChange={setSelectedDevice}
              style={{ width: 180 }}
              options={devices
                .filter((d) => d.isOnline)
                .map((d) => ({ label: d.name, value: d.id }))}
              allowClear
            />
            <Input.TextArea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Javob yozing..."
              autoSize={{ minRows: 1, maxRows: 3 }}
              style={{ flex: 1 }}
              onPressEnter={(e) => {
                if (!e.shiftKey && replyText.trim() && lastMsg) {
                  e.preventDefault();
                  replyMut.mutate({ msgId: lastMsg.id, body: replyText.trim() });
                }
              }}
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => {
                if (replyText.trim() && lastMsg) {
                  replyMut.mutate({ msgId: lastMsg.id, body: replyText.trim() });
                }
              }}
              loading={replyMut.isPending}
            >
              Yuborish
            </Button>
          </ReplyArea>
        </Card>
      </ChatContainer>
    </div>
  );
}

export default ConversationPage;
