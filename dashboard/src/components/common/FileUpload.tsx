import { Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Dragger } = Upload;

interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  hint?: string;
  onFile: (file: File) => void;
}

export function FileUpload({
  accept = '.csv,.xlsx,.xls',
  maxSizeMB = 10,
  hint = 'CSV yoki Excel fayl yuklang',
  onFile,
}: FileUploadProps) {
  const props: UploadProps = {
    name: 'file',
    multiple: false,
    accept,
    showUploadList: false,
    beforeUpload: (file) => {
      const isValid = maxSizeMB
        ? file.size / 1024 / 1024 < maxSizeMB
        : true;

      if (!isValid) {
        message.error(`Fayl hajmi ${maxSizeMB}MB dan oshmasligi kerak`);
        return false;
      }

      onFile(file);
      return false;
    },
  };

  return (
    <Dragger {...props}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">Faylni shu yerga tashlang yoki bosing</p>
      <p className="ant-upload-hint">{hint}</p>
    </Dragger>
  );
}
