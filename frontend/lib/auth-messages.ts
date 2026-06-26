export function authMessage(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }

  if (normalized.includes("email not confirmed")) {
    return "이메일 인증 후 로그인해 주세요.";
  }

  if (normalized.includes("user already registered") || normalized.includes("already registered")) {
    return "이미 가입된 이메일입니다. 로그인해 주세요.";
  }

  if (normalized.includes("password")) {
    return "비밀번호 조건을 확인해 주세요.";
  }

  if (normalized.includes("provider is not enabled") || normalized.includes("unsupported provider")) {
    return "카카오 로그인이 아직 Supabase에서 활성화되지 않았습니다.";
  }

  return message || "요청을 처리하지 못했습니다.";
}
