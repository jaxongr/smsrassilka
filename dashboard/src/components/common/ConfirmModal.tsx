import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface ConfirmModalProps {
  title: string;
  content: string;
  onConfirm: () => void;
  okText?: string;
  cancelText?: string;
  danger?: boolean;
}

export function showConfirmModal({
  title,
  content,
  onConfirm,
  okText = 'Ha',
  cancelText = 'Bekor qilish',
  danger = false,
}: ConfirmModalProps) {
  Modal.confirm({
    title,
    icon: <ExclamationCircleOutlined />,
    content,
    okText,
    cancelText,
    okButtonProps: { danger },
    onOk: onConfirm,
    centered: true,
  });
}
