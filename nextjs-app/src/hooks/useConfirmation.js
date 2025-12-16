import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

export const useConfirmation = () => {
  const [confirmation, setConfirmation] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Confirm",
    cancelText: "Cancel",
    type: "warning",
    onConfirm: null,
    onCancel: null,
    isLoading: false});

  const { toast } = useToast();

  const showConfirmation = useCallback(
    ({
      title = "Confirm Action",
      message,
      confirmText = "Confirm",
      cancelText = "Cancel",
      type = "warning",
      onConfirm,
      onCancel}) => {
      setConfirmation({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: onConfirm || (() => {}),
        onCancel: onCancel || (() => {}),
        isLoading: false});
    },
    []
  );

  const hideConfirmation = useCallback(() => {
    setConfirmation((prev) => ({
      ...prev,
      isOpen: false,
      isLoading: false}));
  }, []);

  const setLoading = useCallback((isLoading) => {
    setConfirmation((prev) => ({
      ...prev,
      isLoading}));
  }, []);

  const confirm = useCallback(async () => {
    try {
      setLoading(true);
      await confirmation.onConfirm();
      hideConfirmation();
      toast.success("Action completed successfully");
    } catch (error) {
      console.error("Confirmation action failed:", error);
      toast.error(error.message || "Action failed");
    } finally {
      setLoading(false);
    }
  }, [confirmation.onConfirm, hideConfirmation, toast]);

  const cancel = useCallback(() => {
    if (confirmation.onCancel) {
      confirmation.onCancel();
    }
    hideConfirmation();
  }, [confirmation.onCancel, hideConfirmation]);

  return {
    confirmation,
    showConfirmation,
    hideConfirmation,
    confirm,
    cancel,
    setLoading};
};
