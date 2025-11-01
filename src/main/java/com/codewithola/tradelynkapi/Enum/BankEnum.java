package com.codewithola.tradelynkapi.Enum;


import lombok.Getter;

@Getter
public enum BankEnum {
    ACCESS_BANK("044", "Access Bank"),
    ZENITH_BANK("057", "Zenith Bank"),
    GTB("058", "Guaranty Trust Bank"),
    FIRST_BANK("011", "First Bank of Nigeria"),
    UBA("033", "United Bank for Africa"),
    WEMA_BANK("035", "Wema Bank"),
    STERLING_BANK("232", "Sterling Bank"),
    FCMB("214", "First City Monument Bank"),
    UNION_BANK("032", "Union Bank"),
    STANBIC_IBTC("221", "Stanbic IBTC Bank"),
    ECOBANK("050", "Ecobank Nigeria"),
    FIDELITY_BANK("070", "Fidelity Bank"),
    POLARIS_BANK("076", "Polaris Bank"),
    KEYSTONE_BANK("082", "Keystone Bank"),
    JAIZ_BANK("301", "Jaiz Bank"),
    PROVIDUS_BANK("101", "Providus Bank"),
    KUDA_BANK("090267", "Kuda Microfinance Bank"),
    OPAY("100004", "OPay"),
    PALMPAY("100033", "PalmPay"),
    MONIEPOINT("50515", "Moniepoint Microfinance Bank");

    private final String code;
    private final String name;

    BankEnum(String code, String name) {
        this.code = code;
        this.name = name;
    }

    public static BankEnum fromCode(String code) {
        for (BankEnum bank : values()) {
            if (bank.code.equals(code)) {
                return bank;
            }
        }
        throw new IllegalArgumentException("Invalid bank code: " + code);
    }

    public static BankEnum fromName(String name) {
        for (BankEnum bank : values()) {
            if (bank.name.equalsIgnoreCase(name)) {
                return bank;
            }
        }
        throw new IllegalArgumentException("Invalid bank name: " + name);
    }
}