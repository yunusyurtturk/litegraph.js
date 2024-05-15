import stylistic from '@stylistic/eslint-plugin'

export default [{
    "plugins": {
        "@stylistic":stylistic
    },
    "rules": {
        "@stylistic/arrow-parens": [0, "always"],
        "@stylistic/arrow-spacing": [0, { "before": true, "after": true }],
        "@stylistic/brace-style":[0, "1tbs"],
        "@stylistic/allowSingleLine": [0, false],
        "@stylistic/comma-dangle": [0, "always-multiline"],
        "@stylistic/comma-spacing": [0, { "before": false, "after": true }],
        "@stylistic/comma-style": [0, "last"],
        "@stylistic/computed-property-spacing": [0, "never"],
        "@stylistic/dot-location": [0, "object"],
        "@stylistic/eol-last": [0, "always"],
        "@stylistic/function-call-spacing": [0, "never"],
        "@stylistic/function-paren-newline": [0, "multiline"],
        "@stylistic/generator-star-spacing": [0, {"before": true, "after": false}],
        "@stylistic/implicit-arrow-linebreak": [0, "beside"],
        "@stylistic/indent": [0, 4]
        
    }
}]
