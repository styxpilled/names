<script lang="ts">
	export let content: string[] = [];
	export let current = '';
	export let input: HTMLInputElement | undefined = undefined;
	export let label = '';

	$: content = [...new Set(content)];

	const setTag = (e: KeyboardEvent) => {
		if (e.key === 'Enter' && current !== '') {
			content.push(current);
			content = content;
			current = '';
		}
	};

	const editTag = (i: number) => {
		if (input) input.focus();
		if (current !== '') content.push(current);
		current = content.splice(i, 1)[0];
		content = content;
	};

	const removeTag = (i: number) => {
		content.splice(i, 1);
		content = content;
	};
</script>

<label>
	{label}
	<input bind:this={input} bind:value={current} on:keyup={setTag} />
	{#if content.length > 0}
		<ul>
			{#each content as tag, i}
				<li>
					<button class="tag" on:click={() => editTag(i)}>{tag}</button>
					<button class="btn error outline xs" on:click={() => removeTag(i)}> X </button>
				</li>
			{/each}
		</ul>
	{/if}
</label>

<style>
	ul {
		width: fit-content;
	}
</style>
