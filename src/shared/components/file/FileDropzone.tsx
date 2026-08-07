type FileDropzoneProps = {
  label?: string;
  accept?: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
};

export function FileDropzone({
  label = 'Upload file',
  accept,
  multiple,
  onFilesSelected
}: FileDropzoneProps) {
  return (
    <label className="file-dropzone">
      <span>{label}</span>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(event) => onFilesSelected(Array.from(event.currentTarget.files ?? []))}
      />
    </label>
  );
}
