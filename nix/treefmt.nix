{ inputs, ... }:
{
  imports = [
    inputs.treefmt-nix.flakeModule
  ];
  perSystem.treefmt = {
    programs.nixfmt.enable = true;
    programs.oxfmt.enable = true;
    settings.excludes = [
      "node_modules/**"
      "package.json"
      "package-lock.json"
      "*.md"
    ];
    projectRootFile = "tsconfig.json";
  };
}
