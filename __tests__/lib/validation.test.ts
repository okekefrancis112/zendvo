import { normalizePhoneNumber, validatePhoneNumber } from "@/lib/validation";

describe("normalizePhoneNumber", () => {
  it("strips spaces", () => {
    expect(normalizePhoneNumber("811 234 5678")).toBe("8112345678");
  });

  it("strips dashes", () => {
    expect(normalizePhoneNumber("811-234-5678")).toBe("8112345678");
  });

  it("strips parentheses and dots", () => {
    expect(normalizePhoneNumber("(234)811.234.5678")).toBe("2348112345678");
  });

  it("preserves leading +", () => {
    expect(normalizePhoneNumber("+234 811 234 5678")).toBe("+2348112345678");
  });

  it("returns empty string for empty input", () => {
    expect(normalizePhoneNumber("")).toBe("");
  });

  it("returns unchanged string when no formatting present", () => {
    expect(normalizePhoneNumber("+2348112345678")).toBe("+2348112345678");
  });
});

describe("validatePhoneNumber", () => {
  it("accepts valid local number", () => {
    expect(validatePhoneNumber("8112345678")).toBe(true);
  });

  it("accepts valid international number with +", () => {
    expect(validatePhoneNumber("+2348112345678")).toBe(true);
  });

  it("accepts number with formatting", () => {
    expect(validatePhoneNumber("+234-811-234-5678")).toBe(true);
  });

  it("accepts minimum length number (7 digits)", () => {
    expect(validatePhoneNumber("1234567")).toBe(true);
  });

  it("accepts maximum length number (15 digits)", () => {
    expect(validatePhoneNumber("123456789012345")).toBe(true);
  });

  it("rejects too short number", () => {
    expect(validatePhoneNumber("12345")).toBe(false);
  });

  it("rejects too long number (16+ digits)", () => {
    expect(validatePhoneNumber("1234567890123456")).toBe(false);
  });

  it("rejects alphabetic characters", () => {
    expect(validatePhoneNumber("abcdefghij")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(validatePhoneNumber("")).toBe(false);
  });

  it("rejects string with only formatting characters", () => {
    expect(validatePhoneNumber("---")).toBe(false);
  });
});
