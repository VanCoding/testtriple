{
    inputs.nixpks.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    inputs.flake-utils.url = "github:numtide/flake-utils";
    outputs = {nixpkgs,flake-utils,...}: flake-utils.lib.eachDefaultSystem (system: with import nixpkgs {inherit system;}; {
        devShells.default = mkShell {
            buildInputs = [nodejs_20];
        };
    });
}
