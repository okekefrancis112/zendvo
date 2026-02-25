import { calculateProcessingFee, FeeConfig } from "@/lib/fees";

describe("calculateProcessingFee", () => {
  describe("percentage-based fees", () => {
    const config: FeeConfig = {
      type: "percentage",
      value: 2.5,
      minFee: 50,
      maxFee: 5000,
    };

    it("should calculate percentage fee correctly", () => {
      expect(calculateProcessingFee(10000, config)).toBe(250);
      expect(calculateProcessingFee(20000, config)).toBe(500);
      expect(calculateProcessingFee(100000, config)).toBe(2500);
    });

    it("should apply minimum fee when calculated fee is below minimum", () => {
      expect(calculateProcessingFee(1000, config)).toBe(50);
      expect(calculateProcessingFee(500, config)).toBe(50);
    });

    it("should apply maximum fee when calculated fee exceeds maximum", () => {
      expect(calculateProcessingFee(300000, config)).toBe(5000);
      expect(calculateProcessingFee(500000, config)).toBe(5000);
    });
  });

  describe("flat fees", () => {
    const config: FeeConfig = {
      type: "flat",
      value: 100,
    };

    it("should return flat fee regardless of amount", () => {
      expect(calculateProcessingFee(1000, config)).toBe(100);
      expect(calculateProcessingFee(10000, config)).toBe(100);
      expect(calculateProcessingFee(100000, config)).toBe(100);
    });
  });

  describe("default configuration", () => {
    it("should use default config when none provided", () => {
      expect(calculateProcessingFee(10000)).toBe(250);
      expect(calculateProcessingFee(1000)).toBe(50);
      expect(calculateProcessingFee(300000)).toBe(5000);
    });
  });

  describe("edge cases", () => {
    it("should handle zero amount", () => {
      expect(calculateProcessingFee(0)).toBe(50);
    });

    it("should round to 2 decimal places", () => {
      const config: FeeConfig = {
        type: "percentage",
        value: 2.75,
      };
      expect(calculateProcessingFee(1000, config)).toBe(27.5);
    });
  });
});
