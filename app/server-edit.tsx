/**
 * 服务器编辑页 —— 新增/编辑 WebDAV 连接
 * 通过 URL 参数 ?id=xxx 判断是编辑还是新增
 */
import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useServerStore } from "../src/stores/server";
import { testConnection } from "../src/services/webdav";

export default function ServerEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const servers = useServerStore((s) => s.servers);
  const addServer = useServerStore((s) => s.addServer);
  const updateServer = useServerStore((s) => s.updateServer);

  // 表单状态
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [testing, setTesting] = useState(false);

  // 编辑模式：加载已有数据
  useEffect(() => {
    if (id) {
      const server = servers.find((s) => s.id === id);
      if (server) {
        setName(server.name);
        setUrl(server.url);
        setUsername(server.username);
        setPassword(server.password);
      }
    }
  }, [id]);

  // 测试连接
  const handleTest = async () => {
    if (!url.trim()) {
      Alert.alert("提示", "请输入服务器地址");
      return;
    }
    setTesting(true);
    try {
      const ok = await testConnection({
        id: "test",
        name: "test",
        url: url.trim(),
        username: username.trim(),
        password,
        createdAt: 0,
      });
      Alert.alert(ok ? "连接成功 ✅" : "连接失败 ❌", ok ? "服务器响应正常" : "请检查地址和账号密码");
    } catch (e: any) {
      Alert.alert("连接失败 ❌", e?.message || "未知错误");
    } finally {
      setTesting(false);
    }
  };

  // 保存
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("提示", "请输入服务器名称");
      return;
    }
    if (!url.trim()) {
      Alert.alert("提示", "请输入服务器地址");
      return;
    }

    // 确保 URL 以 / 结尾
    const finalUrl = url.trim().endsWith("/") ? url.trim() : url.trim() + "/";

    if (id) {
      // 编辑模式
      const existing = servers.find((s) => s.id === id);
      if (existing) {
        await updateServer({
          ...existing,
          name: name.trim(),
          url: finalUrl,
          username: username.trim(),
          password,
        });
      }
    } else {
      // 新增模式
      await addServer({
        name: name.trim(),
        url: finalUrl,
        username: username.trim(),
        password,
      });
    }
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.form}>
        {/* 服务器名称 */}
        <Text style={styles.label}>服务器名称</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="例如：我的NAS"
          placeholderTextColor="#999"
        />

        {/* WebDAV 地址 */}
        <Text style={styles.label}>WebDAV 地址</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="https://nas.example.com/dav"
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="url"
        />

        {/* 用户名 */}
        <Text style={styles.label}>用户名</Text>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={setUsername}
          placeholder="输入用户名"
          placeholderTextColor="#999"
          autoCapitalize="none"
        />

        {/* 密码 */}
        <Text style={styles.label}>密码</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="输入密码"
          placeholderTextColor="#999"
          secureTextEntry
        />

        {/* 测试连接 */}
        <TouchableOpacity
          style={[styles.testButton, testing && styles.buttonDisabled]}
          onPress={handleTest}
          disabled={testing}
        >
          {testing ? (
            <ActivityIndicator color="#2196F3" />
          ) : (
            <Text style={styles.testButtonText}>🔌 测试连接</Text>
          )}
        </TouchableOpacity>

        {/* 保存按钮 */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {id ? "保存修改" : "添加服务器"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  form: { padding: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 14,
    fontSize: 16,
    color: "#333",
  },
  testButton: {
    marginTop: 24,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2196F3",
    alignItems: "center",
  },
  testButtonText: {
    color: "#2196F3",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  saveButton: {
    marginTop: 12,
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#2196F3",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
