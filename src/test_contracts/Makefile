.PHONY: clippy proto-gen build fmt

clippy:
	@cargo clippy --all --all-targets -- -D warnings

fmt:
	@cargo fmt -- --check

build: clippy fmt
	@./build_release.sh
	@./check_contracts.sh
