mod.rs - The entry point for the macro, where code is parsed, and then generated.
mod.rs - 巨集的入口點，在其中解析代碼，然後生成代碼。
parse.rs - The parsing logic for the macro, extracting the information we need to generate code.
parse.rs - 巨集的解析邏輯，提取生成代碼所需的資訊。
expand.rs - The expansion / generation code, which will write new code for us with the data provided.
expand.rs - 擴展 / 生成代碼，它將使用提供的數據為我們編寫新代碼。