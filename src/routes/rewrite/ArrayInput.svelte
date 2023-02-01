<script lang="ts">
	export let content: string[] = [];
	export let current = '';
	export let input: HTMLInputElement | undefined = undefined;

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

<p>
	{#if content.length > 0}
		<ul>
			{#each content as tag, i}
				<li>
					<span>
						<button class="tag" on:click={() => editTag(i)}>{tag}</button>
						<button on:click={() => removeTag(i)}> X </button>
					</span>
				</li>
			{/each}
		</ul>
	{/if}
	<input bind:value={current} on:keyup={setTag} />
</p>
