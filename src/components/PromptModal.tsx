/**
 * 可复用的输入弹窗组件
 * 跨平台替代 Alert.prompt（后者仅 iOS 可用）
 * 用于：移动 / 复制 / 重命名 等需要用户输入文本的操作
 */
import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Modal,
} from "react-native";

interface PromptModalProps {
  visible: boolean;
  title: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
  // 用户点「确定」时回调，参数为输入框当前值
  onConfirm: (value: string) => void;
  // 用户点「取消」或按返回键时回调
  onCancel: () => void;
}

export function PromptModal({
  visible,
  title,
  message,
  defaultValue,
  placeholder,
  onConfirm,
  onCancel,
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue || "");

  // 每次弹窗打开时，把输入框重置为默认值
  useEffect(() => {
    if (visible) setValue(defaultValue || "");
  }, [visible, defaultValue]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor="#999"
            autoFocus
            autoCapitalize="none"
          />
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.confirmBtn]}
              onPress={() => onConfirm(value)}
            >
              <Text style={styles.confirmText}>确定</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#666",
    marginBottom: 14,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#333",
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelBtn: {
    backgroundColor: "#f0f0f0",
  },
  confirmBtn: {
    backgroundColor: "#2196F3",
  },
  cancelText: {
    color: "#666",
    fontSize: 15,
    fontWeight: "600",
  },
  confirmText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
